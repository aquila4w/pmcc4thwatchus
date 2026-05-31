import { getModel, toObjectId } from "./get-model";
import { buildDateMatch } from "./date-filter";

interface TechnicalResult {
  deviceBreakdown: { name: string; scans: number; conversionRate: number }[];
  browserBreakdown: { name: string; scans: number; conversionRate: number }[];
  osBreakdown: { name: string; scans: number; conversionRate: number }[];
  locationBreakdown: { city: string; region: string; country: string; scans: number; registered: number; conversionRate: number }[];
  behavioralMetrics: { avgTimeOnPage: number | null; avgScrollDepth: number | null; avgFormStartDelay: number | null; rageClickCount: number; adBlockerDetectedCount: number; sampleSize: number };
}

export async function getTechnical(eventId: string, from?: string | null, to?: string | null): Promise<TechnicalResult> {
  const model = await getModel("invite-scans");
  const dateMatch = buildDateMatch("scannedAt", from, to);
  const toRate = (s: { scans: number; registered: number }) => (s.scans > 0 ? Math.round((s.registered / s.scans) * 100) : 0);
  const roundOrNull = (v: number | undefined) => (v != null ? Math.round(v) : null);

  const result = await model.aggregate([
    { $match: { event: toObjectId(eventId), ...dateMatch } },
    { $facet: {
      deviceBreakdown: [
        { $group: { _id: { $ifNull: ["$device", "unknown"] }, scans: { $sum: 1 }, registered: { $sum: { $cond: [{ $eq: ["$registered", true] }, 1, 0] } } } },
        { $project: { _id: 0, name: "$_id", scans: 1, registered: 1 } }, { $sort: { scans: -1 } },
      ],
      browserBreakdown: [
        { $group: { _id: { $ifNull: ["$browser", "unknown"] }, scans: { $sum: 1 }, registered: { $sum: { $cond: [{ $eq: ["$registered", true] }, 1, 0] } } } },
        { $project: { _id: 0, name: "$_id", scans: 1, registered: 1 } }, { $sort: { scans: -1 } },
      ],
      osBreakdown: [
        { $group: { _id: { $ifNull: ["$os", "unknown"] }, scans: { $sum: 1 }, registered: { $sum: { $cond: [{ $eq: ["$registered", true] }, 1, 0] } } } },
        { $project: { _id: 0, name: "$_id", scans: 1, registered: 1 } }, { $sort: { scans: -1 } },
      ],
      locationBreakdown: [
        { $match: { $or: [{ city: { $exists: true, $ne: "" } }, { region: { $exists: true, $ne: "" } }, { country: { $exists: true, $ne: "" } }] } },
        { $group: { _id: { city: { $ifNull: ["$city", ""] }, region: { $ifNull: ["$region", ""] }, country: { $ifNull: ["$country", ""] } }, scans: { $sum: 1 }, registered: { $sum: { $cond: [{ $eq: ["$registered", true] }, 1, 0] } } } },
        { $project: { _id: 0, city: "$_id.city", region: "$_id.region", country: "$_id.country", scans: 1, registered: 1 } },
        { $sort: { scans: -1 } },
      ],
      behavioral: [
        { $match: { registered: true } },
        { $group: { _id: null, avgTimeOnPage: { $avg: { $cond: [{ $gt: ["$timeOnPage", 0] }, "$timeOnPage", "$$REMOVE"] } }, avgScrollDepth: { $avg: { $cond: [{ $gt: ["$scrollDepth", 0] }, "$scrollDepth", "$$REMOVE"] } }, avgFormStartDelay: { $avg: { $cond: [{ $gte: ["$formStartDelay", 0] }, "$formStartDelay", "$$REMOVE"] } }, sampleSize: { $sum: { $cond: [{ $gt: ["$timeOnPage", 0] }, 1, 0] } } } },
      ],
      rageClicks: [{ $match: { rageClickDetected: true } }, { $count: "count" }],
      adBlockers: [{ $match: { adBlockerDetected: true } }, { $count: "count" }],
    } },
  ]).toArray();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f: any = result[0] || {};
  const b = f.behavioral?.[0] || {} as Record<string, number>;
  type BD = { name: string; scans: number; registered: number };
  type LD = { city: string; region: string; country: string; scans: number; registered: number };
  return {
    deviceBreakdown: ((f.deviceBreakdown || []) as BD[]).map((d) => ({ name: d.name, scans: d.scans, conversionRate: toRate(d) })),
    browserBreakdown: ((f.browserBreakdown || []) as BD[]).map((d) => ({ name: d.name, scans: d.scans, conversionRate: toRate(d) })),
    osBreakdown: ((f.osBreakdown || []) as BD[]).map((d) => ({ name: d.name, scans: d.scans, conversionRate: toRate(d) })),
    locationBreakdown: ((f.locationBreakdown || []) as LD[]).map((l) => ({ city: l.city || "—", region: l.region || "—", country: l.country || "—", scans: l.scans, registered: l.registered, conversionRate: toRate(l) })),
    behavioralMetrics: { avgTimeOnPage: roundOrNull(b.avgTimeOnPage), avgScrollDepth: roundOrNull(b.avgScrollDepth), avgFormStartDelay: roundOrNull(b.avgFormStartDelay), rageClickCount: f.rageClicks?.[0]?.count || 0, adBlockerDetectedCount: f.adBlockers?.[0]?.count || 0, sampleSize: b.sampleSize || 0 },
  };
}
