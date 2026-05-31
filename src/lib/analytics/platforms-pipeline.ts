import { getPayload } from "payload";
import config from "@payload-config";
import { getModel } from "./get-model";
import { buildDateMatch } from "./date-filter";

interface PlatformData { platformId: string; platformName: string; scans: number; registrations: number; conversionRate: number }

export async function getPlatforms(eventId: string, from?: string | null, to?: string | null): Promise<PlatformData[]> {
  const payload = await getPayload({ config });
  const ScanModel = await getModel("invite-scans");
  const RegModel = await getModel("event-registrations");
  const scanDateMatch = buildDateMatch("scannedAt", from, to);
  const regDateMatch = buildDateMatch("createdAt", from, to);

  const platformLinks = await payload.find({ collection: "platform-event-links", where: { event: { equals: eventId } }, limit: 1000, depth: 0, overrideAccess: true });
  const linkToPlatform = new Map<string, string>();
  for (const pl of platformLinks.docs) {
    const platformId = (pl as Record<string, unknown>).platform as string;
    if (platformId) linkToPlatform.set(String(pl.id), platformId);
  }

  const [scanByLink, regByLink] = await Promise.all([
    ScanModel.aggregate([
      { $addFields: { __eventOid: { $toObjectId: eventId } } },
      { $match: { $expr: { $eq: ["$event", "$__eventOid"] }, inviteType: "platform", platformEventLink: { $exists: true, $ne: null }, ...scanDateMatch } },
      { $group: { _id: "$platformEventLink", scans: { $sum: 1 } } },
    ]),
    RegModel.aggregate([
      { $addFields: { __eventOid: { $toObjectId: eventId } } },
      { $match: { $expr: { $eq: ["$event", "$__eventOid"] }, platformEventLink: { $exists: true, $ne: null }, ...regDateMatch } },
      { $group: { _id: "$platformEventLink", count: { $sum: 1 } } },
    ]),
  ]);

  const scanMap = new Map<string, number>();
  for (const s of scanByLink) { const pid = linkToPlatform.get(String(s._id)); if (pid) scanMap.set(pid, (scanMap.get(pid) || 0) + s.scans); }
  const regMap = new Map<string, number>();
  for (const r of regByLink) { const pid = linkToPlatform.get(String(r._id)); if (pid) regMap.set(pid, (regMap.get(pid) || 0) + r.count); }

  const allIds = new Set([...scanMap.keys(), ...regMap.keys()]);
  const nameMap = new Map<string, string>();
  if (allIds.size > 0) {
    const docs = await payload.find({ collection: "online-platforms", where: { id: { in: Array.from(allIds) } }, limit: 0, depth: 0, overrideAccess: true });
    for (const doc of docs.docs) nameMap.set(String(doc.id), doc.name || String(doc.id));
  }

  return Array.from(allIds).map((id) => ({
    platformId: id, platformName: nameMap.get(id) || id,
    scans: scanMap.get(id) || 0, registrations: regMap.get(id) || 0,
    conversionRate: (scanMap.get(id) || 0) > 0 ? Math.round(((regMap.get(id) || 0) / (scanMap.get(id) || 0)) * 100) : 0,
  })).sort((a, b) => b.scans - a.scans);
}
