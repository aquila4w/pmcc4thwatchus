import { getModel, toObjectId } from "./get-model";
import { buildDateMatch } from "./date-filter";

interface OverviewResult {
  overview: {
    totalRegistrations: number; attendedCount: number; baptizedCount: number; waitlistedCount: number;
    totalScans: number; memberScans: number; churchScans: number; platformScans: number;
    overallConversionRate: number; attendanceRate: number; baptismRate: number;
    statusDistribution: Record<string, number>; spotsRemaining: number | null;
    eventTitle: string | null; eventStartDate: string | null; eventLocation: string | null;
  };
  scanTimeline: { date: string; memberScans: number; churchScans: number; platformScans: number; registrations: number }[];
}

export async function getOverview(
  eventId: string,
  event: { title?: string; startDate?: string; location?: string; maxAttendees?: number },
  from?: string | null, to?: string | null,
): Promise<OverviewResult> {
  const ScanModel = await getModel("invite-scans");
  const RegModel = await getModel("event-registrations");
  const eventOid = toObjectId(eventId);
  const scanDateMatch = buildDateMatch("scannedAt", from, to);
  const regDateMatch = buildDateMatch("createdAt", from, to);

  const [scanResult, regResult] = await Promise.all([
    ScanModel.aggregate([
      { $match: { event: eventOid, ...scanDateMatch } },
      { $facet: {
        counts: [{ $group: { _id: null, totalScans: { $sum: 1 }, memberScans: { $sum: { $cond: [{ $eq: ["$inviteType", "member"] }, 1, 0] } }, churchScans: { $sum: { $cond: [{ $eq: ["$inviteType", "church"] }, 1, 0] } }, platformScans: { $sum: { $cond: [{ $eq: ["$inviteType", "platform"] }, 1, 0] } }, registeredFromScans: { $sum: { $cond: [{ $eq: ["$registered", true] }, 1, 0] } } } }],
        timeline: [
          { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" } }, type: "$inviteType" }, count: { $sum: 1 }, registrations: { $sum: { $cond: [{ $eq: ["$registered", true] }, 1, 0] } } } },
          { $group: { _id: "$_id.date", memberScans: { $sum: { $cond: [{ $eq: ["$_id.type", "member"] }, "$count", 0] } }, churchScans: { $sum: { $cond: [{ $eq: ["$_id.type", "church"] }, "$count", 0] } }, platformScans: { $sum: { $cond: [{ $eq: ["$_id.type", "platform"] }, "$count", 0] } }, registrations: { $sum: "$registrations" } } },
          { $project: { _id: 0, date: "$_id", memberScans: 1, churchScans: 1, platformScans: 1, registrations: 1 } },
          { $sort: { date: 1 } },
        ],
      } },
    ]).toArray(),
    RegModel.aggregate([
      { $match: { event: eventOid, ...regDateMatch } },
      { $facet: {
        counts: [{ $group: { _id: null, totalRegistrations: { $sum: 1 }, attended: { $sum: { $cond: [{ $in: ["$status", ["attended", "baptized"]] }, 1, 0] } }, baptized: { $sum: { $cond: [{ $eq: ["$status", "baptized"] }, 1, 0] } }, waitlisted: { $sum: { $cond: [{ $eq: ["$status", "waitlisted"] }, 1, 0] } } } }],
        statusDistribution: [{ $group: { _id: { $ifNull: ["$status", "unknown"] }, count: { $sum: 1 } } }, { $project: { _id: 0, status: "$_id", count: 1 } }],
      } },
    ]).toArray(),
  ]);

  const scanCounts = scanResult[0]?.counts?.[0] || {};
  const timeline: OverviewResult["scanTimeline"] = scanResult[0]?.timeline || [];
  const regCounts = regResult[0]?.counts?.[0] || {};
  const statusDocs: { status: string; count: number }[] = regResult[0]?.statusDistribution || [];

  const totalScans = scanCounts.totalScans || 0;
  const totalRegistrations = regCounts.totalRegistrations || 0;
  const attendedCount = regCounts.attended || 0;
  const baptizedCount = regCounts.baptized || 0;

  const statusDistribution: Record<string, number> = {};
  for (const doc of statusDocs) statusDistribution[doc.status] = doc.count;

  return {
    overview: {
      totalRegistrations, attendedCount, baptizedCount,
      waitlistedCount: regCounts.waitlisted || 0,
      totalScans,
      memberScans: scanCounts.memberScans || 0,
      churchScans: scanCounts.churchScans || 0,
      platformScans: scanCounts.platformScans || 0,
      overallConversionRate: totalScans > 0 ? Math.round(((scanCounts.registeredFromScans || 0) / totalScans) * 100) : 0,
      attendanceRate: totalRegistrations > 0 ? Math.round((attendedCount / totalRegistrations) * 100) : 0,
      baptismRate: attendedCount > 0 ? Math.round((baptizedCount / attendedCount) * 100) : 0,
      statusDistribution,
      spotsRemaining: event.maxAttendees ? Math.max(0, event.maxAttendees - totalRegistrations) : null,
      eventTitle: event.title || null, eventStartDate: event.startDate || null, eventLocation: event.location || null,
    },
    scanTimeline: timeline,
  };
}
