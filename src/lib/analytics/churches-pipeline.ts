import { getPayload } from "payload";
import config from "@payload-config";
import { getModel } from "./get-model";
import { buildDateMatch } from "./date-filter";

interface ChurchData {
  churchId: string;
  churchName: string;
  registrations: number;
  scans: number;
  conversionRate: number;
  attendedCount: number;
  baptizedCount: number;
  members: {
    memberId: string;
    memberName: string;
    inviteCode: string;
    scans: number;
    registrations: number;
    conversionRate: number;
  }[];
}

export async function getChurches(
  eventId: string,
  from?: string | null,
  to?: string | null,
): Promise<ChurchData[]> {
  const payload = await getPayload({ config });
  const scanModel = await getModel("invite-scans");
  const regModel = await getModel("event-registrations");

  const scanDateMatch = buildDateMatch("scannedAt", from, to);
  const regDateMatch = buildDateMatch("createdAt", from, to);

  // Run all aggregations + small pre-fetches in parallel
  const [scanByChurch, regByChurch, memberScansByInvite, eventInvites] = await Promise.all([
    // 1. Scan counts grouped by church (using denormalized scan.church field)
    scanModel.aggregate([
      {
        $match: {
          event: eventId,
          inviteType: { $in: ["member", "church"] },
          church: { $exists: true, $ne: null },
          ...scanDateMatch,
        },
      },
      {
        $group: {
          _id: "$church",
          totalScans: { $sum: 1 },
          registeredScans: { $sum: { $cond: [{ $eq: ["$registered", true] }, 1, 0] } },
        },
      },
      { $project: { _id: 0, churchId: "$_id", totalScans: 1, registeredScans: 1 } },
    ]),

    // 2. Registration counts grouped by church
    regModel.aggregate([
      {
        $match: {
          event: eventId,
          invitedByChurch: { $exists: true, $ne: null },
          ...regDateMatch,
        },
      },
      {
        $group: {
          _id: "$invitedByChurch",
          total: { $sum: 1 },
          attended: { $sum: { $cond: [{ $in: ["$status", ["attended", "baptized"]] }, 1, 0] } },
          baptized: { $sum: { $cond: [{ $eq: ["$status", "baptized"] }, 1, 0] } },
        },
      },
      { $project: { _id: 0, churchId: "$_id", total: 1, attended: 1, baptized: 1 } },
    ]),

    // 3. Per-member (per eventInvite) scan counts
    scanModel.aggregate([
      {
        $match: {
          event: eventId,
          inviteType: "member",
          eventInvite: { $exists: true, $ne: null },
          ...scanDateMatch,
        },
      },
      {
        $group: {
          _id: "$eventInvite",
          scans: { $sum: 1 },
        },
      },
      { $project: { _id: 0, eventInviteId: "$_id", scans: 1 } },
    ]),

    // 4. Small pre-fetch: event invites for this event (one per member)
    payload.find({
      collection: "event-invites",
      where: { event: { equals: eventId } },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
  ]);

  // Build registration counts map by church
  const regMap = new Map<string, { total: number; attended: number; baptized: number }>();
  for (const r of regByChurch) {
    regMap.set(String(r.churchId), { total: r.total, attended: r.attended, baptized: r.baptized });
  }

  // Build scan counts map by church
  const scanMap = new Map<string, number>();
  for (const s of scanByChurch) {
    scanMap.set(String(s.churchId), s.totalScans);
  }

  // Build per-member data grouped by church
  const memberScanMap = new Map<string, number>();
  for (const ms of memberScansByInvite) {
    memberScanMap.set(String(ms.eventInviteId), ms.scans);
  }

  // Build members grouped by church from event invites
  const membersByChurch = new Map<string, ChurchData["members"]>();
  const memberByInviteDocId = new Map<string, ChurchData["members"][0]>();
  const inviteDocIds: string[] = [];

  for (const ei of eventInvites.docs) {
    const churchId = String((ei as Record<string, unknown>).church || "unknown");
    const inviteDocId = String(ei.id);
    const scans = memberScanMap.get(inviteDocId) || 0;
    inviteDocIds.push(inviteDocId);

    const member: ChurchData["members"][0] = {
      memberId: String((ei as Record<string, unknown>).invitedBy || ei.id),
      memberName: ((ei as Record<string, unknown>).memberContactName as string) || "Unknown Member",
      inviteCode: (ei as Record<string, unknown>).inviteCode as string,
      scans,
      registrations: 0,
      conversionRate: 0,
    };
    memberByInviteDocId.set(inviteDocId, member);

    if (!membersByChurch.has(churchId)) membersByChurch.set(churchId, []);
    membersByChurch.get(churchId)!.push(member);
  }

  // Batch-fill registration counts per eventInvite doc ID
  if (inviteDocIds.length > 0) {
    const regByInvite = await regModel.aggregate([
      {
        $match: {
          event: eventId,
          eventInvite: { $in: inviteDocIds },
          ...regDateMatch,
        },
      },
      {
        $group: { _id: "$eventInvite", count: { $sum: 1 } },
      },
    ]);
    for (const r of regByInvite) {
      const member = memberByInviteDocId.get(String(r._id));
      if (member) {
        member.registrations = r.count;
        member.conversionRate = member.scans > 0 ? Math.round((member.registrations / member.scans) * 100) : 0;
      }
    }
  }

  // Assemble all church IDs
  const allChurchIds = new Set<string>([
    ...scanMap.keys(),
    ...regMap.keys(),
    ...membersByChurch.keys(),
  ]);

  // Bulk-fetch church names
  const churchIds = Array.from(allChurchIds).filter((id) => id !== "unknown");
  const churchNameMap = new Map<string, string>();
  if (churchIds.length > 0) {
    const churchDocs = await payload.find({
      collection: "churches",
      where: { id: { in: churchIds } },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    });
    for (const doc of churchDocs.docs) {
      churchNameMap.set(String(doc.id), doc.name || String(doc.id));
    }
  }

  // Build result
  const result: ChurchData[] = Array.from(allChurchIds).map((churchId) => {
    const regData = regMap.get(churchId) || { total: 0, attended: 0, baptized: 0 };
    const scans = scanMap.get(churchId) || 0;
    const members = membersByChurch.get(churchId) || [];
    // Sum registrations from members as well
    const memberRegs = members.reduce((sum, m) => sum + m.registrations, 0);
    const totalRegs = regData.total + memberRegs;

    return {
      churchId,
      churchName: churchNameMap.get(churchId) || churchId,
      registrations: totalRegs,
      scans,
      conversionRate: scans > 0 ? Math.round((totalRegs / scans) * 100) : 0,
      attendedCount: regData.attended,
      baptizedCount: regData.baptized,
      members: members.sort((a, b) => b.registrations - a.registrations),
    };
  });

  return result.sort((a, b) => b.registrations - a.registrations);
}
