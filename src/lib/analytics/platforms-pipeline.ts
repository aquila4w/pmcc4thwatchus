import { getPayload } from "payload";
import config from "@payload-config";
import { getModel } from "./get-model";
import { buildDateMatch } from "./date-filter";

interface PlatformData {
  platformId: string;
  platformName: string;
  scans: number;
  registrations: number;
  conversionRate: number;
}

export async function getPlatforms(
  eventId: string,
  from?: string | null,
  to?: string | null,
): Promise<PlatformData[]> {
  const payload = await getPayload({ config });
  const scanModel = await getModel("invite-scans");
  const regModel = await getModel("event-registrations");

  const scanDateMatch = buildDateMatch("scannedAt", from, to);
  const regDateMatch = buildDateMatch("createdAt", from, to);

  // Pre-fetch platform-event-links to map platformEventLink -> platform
  const platformLinks = await payload.find({
    collection: "platform-event-links",
    where: { event: { equals: eventId } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });

  const linkToPlatform = new Map<string, string>();
  for (const pl of platformLinks.docs) {
    const platformId = (pl as Record<string, unknown>).platform as string;
    if (platformId) linkToPlatform.set(String(pl.id), platformId);
  }

  // Run scan and reg aggregations in parallel
  const [scanByLink, regByLink] = await Promise.all([
    scanModel.aggregate([
      {
        $match: {
          event: eventId,
          inviteType: "platform",
          platformEventLink: { $exists: true, $ne: null },
          ...scanDateMatch,
        },
      },
      {
        $group: { _id: "$platformEventLink", scans: { $sum: 1 } },
      },
    ]),

    regModel.aggregate([
      {
        $match: {
          event: eventId,
          platformEventLink: { $exists: true, $ne: null },
          ...regDateMatch,
        },
      },
      {
        $group: { _id: "$platformEventLink", count: { $sum: 1 } },
      },
    ]),
  ]);

  // Aggregate scans by platform ID
  const scanMap = new Map<string, number>();
  for (const s of scanByLink) {
    const platformId = linkToPlatform.get(String(s._id));
    if (platformId) scanMap.set(platformId, (scanMap.get(platformId) || 0) + s.scans);
  }

  // Aggregate registrations by platform ID
  const regMap = new Map<string, number>();
  for (const r of regByLink) {
    const platformId = linkToPlatform.get(String(r._id));
    if (platformId) regMap.set(platformId, (regMap.get(platformId) || 0) + r.count);
  }

  // Collect all platform IDs
  const allPlatformIds = new Set<string>([
    ...scanMap.keys(),
    ...regMap.keys(),
  ]);

  // Bulk-fetch platform names
  const platformNameMap = new Map<string, string>();
  if (allPlatformIds.size > 0) {
    const docs = await payload.find({
      collection: "online-platforms",
      where: { id: { in: Array.from(allPlatformIds) } },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    });
    for (const doc of docs.docs) {
      platformNameMap.set(String(doc.id), doc.name || String(doc.id));
    }
  }

  return Array.from(allPlatformIds).map((platformId) => {
    const scans = scanMap.get(platformId) || 0;
    const registrations = regMap.get(platformId) || 0;
    return {
      platformId,
      platformName: platformNameMap.get(platformId) || platformId,
      scans,
      registrations,
      conversionRate: scans > 0 ? Math.round((registrations / scans) * 100) : 0,
    };
  }).sort((a, b) => b.scans - a.scans);
}
