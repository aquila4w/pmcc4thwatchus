import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { eventId } = await params;

    // Fetch all scans for this event
    const scans = await payload.find({
      collection: "invite-scans",
      where: { event: { equals: eventId } },
      limit: 5000,
      depth: 0,
      overrideAccess: true,
    });

    // Fetch registrations for this event
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        event: { equals: eventId },
        status: { in: ["registered", "attended", "baptized"] },
      },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    });

    // Fetch church event invites for this event
    const churchInvites = await payload.find({
      collection: "church-event-invites",
      where: { event: { equals: eventId } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    });

    const memberScans = scans.docs.filter((s) => s.inviteType === "member");
    const churchScans = scans.docs.filter((s) => s.inviteType === "church");

    // Conversion rates
    const memberRegistered = scans.docs.filter(
      (s) => s.inviteType === "member" && s.registered
    ).length;
    const churchRegistered = scans.docs.filter(
      (s) => s.inviteType === "church" && s.registered
    ).length;

    // Device breakdown
    const deviceMap: Record<string, { scans: number; registered: number }> = {};
    for (const scan of scans.docs) {
      const d = (scan.device as string) || "unknown";
      if (!deviceMap[d]) deviceMap[d] = { scans: 0, registered: 0 };
      deviceMap[d].scans++;
      if (scan.registered) deviceMap[d].registered++;
    }

    // Browser breakdown
    const browserMap: Record<string, { scans: number; registered: number }> = {};
    for (const scan of scans.docs) {
      const b = (scan.browser as string) || "unknown";
      if (!browserMap[b]) browserMap[b] = { scans: 0, registered: 0 };
      browserMap[b].scans++;
      if (scan.registered) browserMap[b].registered++;
    }

    // Per-church stats (from church scans)
    const churchStats: Record<string, { scans: number; registered: number; placements: Record<string, { scans: number; registered: number }> }> = {};
    for (const scan of churchScans) {
      const churchId = (scan.church as string) || "unknown";
      if (!churchStats[churchId]) {
        churchStats[churchId] = { scans: 0, registered: 0, placements: {} };
      }
      churchStats[churchId].scans++;
      if (scan.registered) churchStats[churchId].registered++;

      const placementId = (scan.adPlacement as string) || "unknown";
      if (!churchStats[churchId].placements[placementId]) {
        churchStats[churchId].placements[placementId] = { scans: 0, registered: 0 };
      }
      churchStats[churchId].placements[placementId].scans++;
      if (scan.registered) churchStats[churchId].placements[placementId].registered++;
    }

    // Enrich church and placement names
    const churchNames: Record<string, string> = {};
    const placementNames: Record<string, string> = {};
    for (const ci of churchInvites.docs) {
      const cid = ci.church as string;
      const pid = ci.adPlacement as string;
      // We already have the IDs, need names
      if (!churchNames[cid]) {
        try {
          const c = await payload.findByID({
            collection: "churches",
            id: cid,
            depth: 0,
            overrideAccess: true,
          });
          churchNames[cid] = c?.name || cid;
        } catch {
          churchNames[cid] = cid;
        }
      }
      if (!placementNames[pid]) {
        try {
          const p = await payload.findByID({
            collection: "ad-placements",
            id: pid,
            depth: 0,
            overrideAccess: true,
          });
          placementNames[pid] = p?.name || pid;
        } catch {
          placementNames[pid] = pid;
        }
      }
    }

    // Build per-church response with names
    const byChurch = Object.entries(churchStats).map(([id, stats]) => ({
      churchId: id,
      churchName: churchNames[id] || id,
      scans: stats.scans,
      registered: stats.registered,
      conversionRate: stats.scans > 0 ? Math.round((stats.registered / stats.scans) * 100) : 0,
      placements: Object.entries(stats.placements).map(([pid, pstats]) => ({
        placementId: pid,
        placementName: placementNames[pid] || pid,
        scans: pstats.scans,
        registered: pstats.registered,
        conversionRate: pstats.scans > 0 ? Math.round((pstats.registered / pstats.scans) * 100) : 0,
      })),
    }));

    // Per-placement aggregate
    const byPlacement: Record<string, { placementId: string; placementName: string; scans: number; registered: number }> = {};
    for (const ci of churchInvites.docs) {
      const pid = ci.adPlacement as string;
      if (!byPlacement[pid]) {
        byPlacement[pid] = {
          placementId: pid,
          placementName: placementNames[pid] || pid,
          scans: 0,
          registered: 0,
        };
      }
      byPlacement[pid].scans += (ci.scanCount as number) || 0;
    }
    // Add registered counts from churchStats
    for (const cs of Object.values(churchStats)) {
      for (const [pid, ps] of Object.entries(cs.placements)) {
        if (byPlacement[pid]) {
          byPlacement[pid].registered += ps.registered;
        }
      }
    }

    return NextResponse.json({
      totalScans: scans.totalDocs,
      memberScans: memberScans.length,
      churchScans: churchScans.length,
      totalRegistrations: registrations.totalDocs,
      conversionRate: {
        member: memberScans.length > 0
          ? Math.round((memberRegistered / memberScans.length) * 100)
          : 0,
        church: churchScans.length > 0
          ? Math.round((churchRegistered / churchScans.length) * 100)
          : 0,
        overall: scans.totalDocs > 0
          ? Math.round(((memberRegistered + churchRegistered) / scans.totalDocs) * 100)
          : 0,
      },
      deviceBreakdown: Object.entries(deviceMap).map(([device, stats]) => ({
        device,
        scans: stats.scans,
        registered: stats.registered,
        conversionRate: stats.scans > 0 ? Math.round((stats.registered / stats.scans) * 100) : 0,
      })),
      browserBreakdown: Object.entries(browserMap).map(([browser, stats]) => ({
        browser,
        scans: stats.scans,
        registered: stats.registered,
        conversionRate: stats.scans > 0 ? Math.round((stats.registered / stats.scans) * 100) : 0,
      })),
      byChurch,
      byPlacement: Object.values(byPlacement),
      churchInviteCount: churchInvites.totalDocs,
    });
  } catch (error) {
    console.error("Scan stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
