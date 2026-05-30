import { getModel } from "./get-model";
import { buildDateMatch } from "./date-filter";

interface TechnicalResult {
  deviceBreakdown: { name: string; scans: number; conversionRate: number }[];
  browserBreakdown: { name: string; scans: number; conversionRate: number }[];
  osBreakdown: { name: string; scans: number; conversionRate: number }[];
  locationBreakdown: {
    city: string;
    region: string;
    country: string;
    scans: number;
    registered: number;
    conversionRate: number;
  }[];
  behavioralMetrics: {
    avgTimeOnPage: number | null;
    avgScrollDepth: number | null;
    avgFormStartDelay: number | null;
    rageClickCount: number;
    adBlockerDetectedCount: number;
    sampleSize: number;
  };
}

export async function getTechnical(
  eventId: string,
  from?: string | null,
  to?: string | null,
): Promise<TechnicalResult> {
  const scanModel = await getModel("invite-scans");
  const dateMatch = buildDateMatch("scannedAt", from, to);

  const result = await scanModel.aggregate([
    {
      $match: {
        event: eventId,
        ...dateMatch,
      },
    },
    {
      $facet: {
        deviceBreakdown: [
          { $group: { _id: { $ifNull: ["$device", "unknown"] }, scans: { $sum: 1 }, registered: { $sum: { $cond: [{ $eq: ["$registered", true] }, 1, 0] } } } },
          { $project: { _id: 0, name: "$_id", scans: 1, registered: 1 } },
          { $sort: { scans: -1 } },
        ],
        browserBreakdown: [
          { $group: { _id: { $ifNull: ["$browser", "unknown"] }, scans: { $sum: 1 }, registered: { $sum: { $cond: [{ $eq: ["$registered", true] }, 1, 0] } } } },
          { $project: { _id: 0, name: "$_id", scans: 1, registered: 1 } },
          { $sort: { scans: -1 } },
        ],
        osBreakdown: [
          { $group: { _id: { $ifNull: ["$os", "unknown"] }, scans: { $sum: 1 }, registered: { $sum: { $cond: [{ $eq: ["$registered", true] }, 1, 0] } } } },
          { $project: { _id: 0, name: "$_id", scans: 1, registered: 1 } },
          { $sort: { scans: -1 } },
        ],
        locationBreakdown: [
          { $match: { $or: [{ city: { $exists: true, $ne: "" } }, { region: { $exists: true, $ne: "" } }, { country: { $exists: true, $ne: "" } }] } },
          {
            $group: {
              _id: { city: { $ifNull: ["$city", ""] }, region: { $ifNull: ["$region", ""] }, country: { $ifNull: ["$country", ""] } },
              scans: { $sum: 1 },
              registered: { $sum: { $cond: [{ $eq: ["$registered", true] }, 1, 0] } },
            },
          },
          { $project: { _id: 0, city: "$_id.city", region: "$_id.region", country: "$_id.country", scans: 1, registered: 1 } },
          { $sort: { scans: -1 } },
        ],
        behavioral: [
          { $match: { registered: true } },
          {
            $group: {
              _id: null,
              avgTimeOnPage: { $avg: { $cond: [{ $gt: ["$timeOnPage", 0] }, "$timeOnPage", "$$REMOVE"] } },
              avgScrollDepth: { $avg: { $cond: [{ $gt: ["$scrollDepth", 0] }, "$scrollDepth", "$$REMOVE"] } },
              avgFormStartDelay: { $avg: { $cond: [{ $gte: ["$formStartDelay", 0] }, "$formStartDelay", "$$REMOVE"] } },
              sampleSize: { $sum: { $cond: [{ $gt: ["$timeOnPage", 0] }, 1, 0] } },
            },
          },
        ],
        rageClicks: [
          { $match: { rageClickDetected: true } },
          { $count: "count" },
        ],
        adBlockers: [
          { $match: { adBlockerDetected: true } },
          { $count: "count" },
        ],
      },
    },
  ]);

  const facet = result[0] || {};
  const roundOrNull = (v: number | undefined) => (v != null ? Math.round(v) : null);
  const behavioral = facet.behavioral?.[0] || {};
  const toConversionRate = (s: { scans: number; registered: number }) => (s.scans > 0 ? Math.round((s.registered / s.scans) * 100) : 0);

  return {
    deviceBreakdown: (facet.deviceBreakdown || []).map((d: { name: string; scans: number; registered: number }) => ({
      name: d.name, scans: d.scans, conversionRate: toConversionRate(d),
    })),
    browserBreakdown: (facet.browserBreakdown || []).map((d: { name: string; scans: number; registered: number }) => ({
      name: d.name, scans: d.scans, conversionRate: toConversionRate(d),
    })),
    osBreakdown: (facet.osBreakdown || []).map((d: { name: string; scans: number; registered: number }) => ({
      name: d.name, scans: d.scans, conversionRate: toConversionRate(d),
    })),
    locationBreakdown: (facet.locationBreakdown || []).map((l: { city: string; region: string; country: string; scans: number; registered: number }) => ({
      city: l.city || "—", region: l.region || "—", country: l.country || "—", scans: l.scans, registered: l.registered,
      conversionRate: toConversionRate(l),
    })),
    behavioralMetrics: {
      avgTimeOnPage: roundOrNull(behavioral.avgTimeOnPage),
      avgScrollDepth: roundOrNull(behavioral.avgScrollDepth),
      avgFormStartDelay: roundOrNull(behavioral.avgFormStartDelay),
      rageClickCount: facet.rageClicks?.[0]?.count || 0,
      adBlockerDetectedCount: facet.adBlockers?.[0]?.count || 0,
      sampleSize: behavioral.sampleSize || 0,
    },
  };
}
