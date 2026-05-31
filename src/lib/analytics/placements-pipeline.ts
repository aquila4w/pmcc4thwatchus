import type { Payload } from "payload";
import { getModel, toObjectId } from "./get-model";
import { buildDateMatch } from "./date-filter";

interface PlacementData { placementId: string; placementName: string; scans: number; registrations: number; conversionRate: number }

export async function getPlacements(payload: Payload, eventId: string, from?: string | null, to?: string | null): Promise<PlacementData[]> {
  const ScanModel = getModel(payload, "invite-scans");
  const RegModel = getModel(payload, "event-registrations");
  const eventOid = toObjectId(eventId);
  const scanDateMatch = buildDateMatch("scannedAt", from, to);
  const regDateMatch = buildDateMatch("createdAt", from, to);

  const churchInvites = await payload.find({ collection: "church-event-invites", where: { event: { equals: eventId } }, limit: 1000, depth: 0, overrideAccess: true });
  const ciToPlacement = new Map<string, string>();
  for (const ci of churchInvites.docs) {
    const placementId = (ci as Record<string, unknown>).adPlacement as string;
    if (placementId) ciToPlacement.set(String(ci.id), placementId);
  }

  const [scanByPlacement, regByChurchInvite] = await Promise.all([
    ScanModel.aggregate([
      { $match: { event: eventOid, inviteType: "church", adPlacement: { $exists: true, $ne: null }, ...scanDateMatch } },
      { $group: { _id: "$adPlacement", scans: { $sum: 1 } } },
      { $project: { _id: 0, placementId: "$_id", scans: 1 } },
    ]),
    RegModel.aggregate([
      { $match: { event: eventOid, sourceType: "church", churchEventInvite: { $exists: true, $ne: null }, ...regDateMatch } },
      { $group: { _id: "$churchEventInvite", count: { $sum: 1 } } },
    ]),
  ]);

  const scanMap = new Map<string, number>();
  for (const s of scanByPlacement) scanMap.set(String(s.placementId), s.scans);
  const regMap = new Map<string, number>();
  for (const r of regByChurchInvite) {
    const pid = ciToPlacement.get(String(r._id));
    if (pid) regMap.set(pid, (regMap.get(pid) || 0) + r.count);
  }

  const allIds = new Set([...scanMap.keys(), ...regMap.keys()]);
  const nameMap = new Map<string, string>();
  if (allIds.size > 0) {
    const docs = await payload.find({ collection: "ad-placements", where: { id: { in: Array.from(allIds) } }, limit: 0, depth: 0, overrideAccess: true });
    for (const doc of docs.docs) nameMap.set(String(doc.id), doc.name || String(doc.id));
  }

  return Array.from(allIds).map((id) => ({
    placementId: id, placementName: nameMap.get(id) || id,
    scans: scanMap.get(id) || 0, registrations: regMap.get(id) || 0,
    conversionRate: (scanMap.get(id) || 0) > 0 ? Math.round(((regMap.get(id) || 0) / (scanMap.get(id) || 0)) * 100) : 0,
  })).sort((a, b) => b.scans - a.scans);
}
