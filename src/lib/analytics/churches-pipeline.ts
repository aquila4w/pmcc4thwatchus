import type { Payload } from "payload";
import { getModel, toObjectId } from "./get-model";
import { buildDateMatch } from "./date-filter";

interface ChurchData {
  churchId: string; churchName: string; registrations: number; scans: number; conversionRate: number; attendedCount: number; baptizedCount: number;
  members: { memberId: string; memberName: string; inviteCode: string; scans: number; registrations: number; conversionRate: number }[];
}

export async function getChurches(payload: Payload, eventId: string, from?: string | null, to?: string | null): Promise<ChurchData[]> {
  const ScanModel = getModel(payload, "invite-scans");
  const RegModel = getModel(payload, "event-registrations");
  const eventOid = toObjectId(eventId);
  const scanDateMatch = buildDateMatch("scannedAt", from, to);
  const regDateMatch = buildDateMatch("createdAt", from, to);

  const [scanByChurch, regByChurch, memberScansByInvite, eventInvites] = await Promise.all([
    ScanModel.aggregate([
      { $match: { event: eventOid, inviteType: { $in: ["member", "church"] }, church: { $exists: true, $ne: null }, ...scanDateMatch } },
      { $group: { _id: "$church", totalScans: { $sum: 1 } } },
      { $project: { _id: 0, churchId: "$_id", totalScans: 1 } },
    ]),
    RegModel.aggregate([
      { $match: { event: eventOid, invitedByChurch: { $exists: true, $ne: null }, ...regDateMatch } },
      { $group: { _id: "$invitedByChurch", total: { $sum: 1 }, attended: { $sum: { $cond: [{ $in: ["$status", ["attended", "baptized"]] }, 1, 0] } }, baptized: { $sum: { $cond: [{ $eq: ["$status", "baptized"] }, 1, 0] } } } },
      { $project: { _id: 0, churchId: "$_id", total: 1, attended: 1, baptized: 1 } },
    ]),
    ScanModel.aggregate([
      { $match: { event: eventOid, inviteType: "member", eventInvite: { $exists: true, $ne: null }, ...scanDateMatch } },
      { $group: { _id: "$eventInvite", scans: { $sum: 1 } } },
      { $project: { _id: 0, eventInviteId: "$_id", scans: 1 } },
    ]),
    payload.find({ collection: "event-invites", where: { event: { equals: eventId } }, limit: 1000, depth: 0, overrideAccess: true }),
  ]);

  const regMap = new Map<string, { total: number; attended: number; baptized: number }>();
  for (const r of regByChurch) regMap.set(String(r.churchId), { total: r.total, attended: r.attended, baptized: r.baptized });

  const scanMap = new Map<string, number>();
  for (const s of scanByChurch) scanMap.set(String(s.churchId), s.totalScans);

  const memberScanMap = new Map<string, number>();
  for (const ms of memberScansByInvite) memberScanMap.set(String(ms.eventInviteId), ms.scans);

  const membersByChurch = new Map<string, ChurchData["members"]>();
  const memberByInviteDocId = new Map<string, ChurchData["members"][0]>();
  const inviteDocIds: string[] = [];

  for (const ei of eventInvites.docs) {
    const churchId = String((ei as Record<string, unknown>).church || "unknown");
    const inviteDocId = String(ei.id);
    inviteDocIds.push(inviteDocId);
    const member: ChurchData["members"][0] = {
      memberId: String((ei as Record<string, unknown>).invitedBy || ei.id),
      memberName: ((ei as Record<string, unknown>).memberContactName as string) || "Unknown Member",
      inviteCode: (ei as Record<string, unknown>).inviteCode as string,
      scans: memberScanMap.get(inviteDocId) || 0, registrations: 0, conversionRate: 0,
    };
    memberByInviteDocId.set(inviteDocId, member);
    if (!membersByChurch.has(churchId)) membersByChurch.set(churchId, []);
    membersByChurch.get(churchId)!.push(member);
  }

  if (inviteDocIds.length > 0) {
    const regByInvite = await RegModel.aggregate([
      { $match: { event: eventOid, eventInvite: { $in: inviteDocIds.map(toObjectId) }, ...regDateMatch } },
      { $group: { _id: "$eventInvite", count: { $sum: 1 } } },
    ]);
    for (const r of regByInvite) {
      const m = memberByInviteDocId.get(String(r._id));
      if (m) { m.registrations = r.count; m.conversionRate = m.scans > 0 ? Math.round((m.registrations / m.scans) * 100) : 0; }
    }
  }

  const allChurchIds = new Set([...scanMap.keys(), ...regMap.keys(), ...membersByChurch.keys()]);
  const churchNameMap = new Map<string, string>();
  const churchIdArray = Array.from(allChurchIds).filter((id) => id !== "unknown");
  if (churchIdArray.length > 0) {
    const docs = await payload.find({ collection: "churches", where: { id: { in: churchIdArray } }, limit: 0, depth: 0, overrideAccess: true });
    for (const doc of docs.docs) churchNameMap.set(String(doc.id), doc.name || String(doc.id));
  }

  return Array.from(allChurchIds).map((churchId) => {
    const regData = regMap.get(churchId) || { total: 0, attended: 0, baptized: 0 };
    const scans = scanMap.get(churchId) || 0;
    const members = membersByChurch.get(churchId) || [];
    const memberRegs = members.reduce((sum, m) => sum + m.registrations, 0);
    const totalRegs = regData.total + memberRegs;
    return {
      churchId, churchName: churchNameMap.get(churchId) || churchId,
      registrations: totalRegs, scans,
      conversionRate: scans > 0 ? Math.round((totalRegs / scans) * 100) : 0,
      attendedCount: regData.attended, baptizedCount: regData.baptized,
      members: members.sort((a, b) => b.registrations - a.registrations),
    };
  }).sort((a, b) => b.registrations - a.registrations);
}
