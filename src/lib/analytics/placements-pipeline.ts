import { getPayload } from "payload";
import config from "@payload-config";
import { getModel } from "./get-model";
import { buildDateMatch } from "./date-filter";

interface PlacementData {
  placementId: string;
  placementName: string;
  scans: number;
  registrations: number;
  conversionRate: number;
}

export async function getPlacements(
  eventId: string,
  from?: string | null,
  to?: string | null,
): Promise<PlacementData[]> {
  const payload = await getPayload({ config });
  const scanModel = await getModel("invite-scans");
  const regModel = await getModel("event-registrations");

  const scanDateMatch = buildDateMatch("scannedAt", from, to);
  const regDateMatch = buildDateMatch("createdAt", from, to);

  // Pre-fetch church-event-invites to map churchEventInvite -> adPlacement
  const churchInvites = await payload.find({
    collection: "church-event-invites",
    where: { event: { equals: eventId } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });

  const ciToPlacement = new Map<string, string>();
  for (const ci of churchInvites.docs) {
    const placementId = (ci as Record<string, unknown>).adPlacement as string;
    if (placementId) ciToPlacement.set(String(ci.id), placementId);
  }

  // Run scan and reg aggregations in parallel
  const [scanByPlacement, regByChurchInvite] = await Promise.all([
    // Scans grouped by denormalized adPlacement field
    scanModel.aggregate([
      {
        $match: {
          event: eventId,
          inviteType: "church",
          adPlacement: { $exists: true, $ne: null },
          ...scanDateMatch,
        },
      },
      {
        $group: {
          _id: "$adPlacement",
          scans: { $sum: 1 },
        },
      },
      { $project: { _id: 0, placementId: "$_id", scans: 1 } },
    ]),

    // Registrations grouped by churchEventInvite
    regModel.aggregate([
      {
        $match: {
          event: eventId,
          sourceType: "church",
          churchEventInvite: { $exists: true, $ne: null },
          ...regDateMatch,
        },
      },
      {
        $group: { _id: "$churchEventInvite", count: { $sum: 1 } },
      },
    ]),
  ]);

  // Build scan map
  const scanMap = new Map<string, number>();
  for (const s of scanByPlacement) {
    scanMap.set(String(s.placementId), s.scans);
  }

  // Map registration counts to placement IDs
  const regMap = new Map<string, number>();
  for (const r of regByChurchInvite) {
    const placementId = ciToPlacement.get(String(r._id));
    if (placementId) {
      regMap.set(placementId, (regMap.get(placementId) || 0) + r.count);
    }
  }

  // Collect all placement IDs
  const allPlacementIds = new Set<string>([
    ...scanMap.keys(),
    ...regMap.keys(),
  ]);

  // Bulk-fetch placement names
  const placementNameMap = new Map<string, string>();
  if (allPlacementIds.size > 0) {
    const docs = await payload.find({
      collection: "ad-placements",
      where: { id: { in: Array.from(allPlacementIds) } },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    });
    for (const doc of docs.docs) {
      placementNameMap.set(String(doc.id), doc.name || String(doc.id));
    }
  }

  return Array.from(allPlacementIds).map((placementId) => {
    const scans = scanMap.get(placementId) || 0;
    const registrations = regMap.get(placementId) || 0;
    return {
      placementId,
      placementName: placementNameMap.get(placementId) || placementId,
      scans,
      registrations,
      conversionRate: scans > 0 ? Math.round((registrations / scans) * 100) : 0,
    };
  }).sort((a, b) => b.scans - a.scans);
}
