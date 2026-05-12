import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await getPayload({ config });

    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

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

    // OS breakdown
    const osMap: Record<string, { scans: number; registered: number }> = {};
    for (const scan of scans.docs) {
      const o = (scan.os as string) || "unknown";
      if (!osMap[o]) osMap[o] = { scans: 0, registered: 0 };
      osMap[o].scans++;
      if (scan.registered) osMap[o].registered++;
    }

    // Location breakdown
    const locationMap: Record<string, { city: string; region: string; country: string; scans: number; registered: number }> = {};
    for (const scan of scans.docs) {
      const city = (scan.city as string) || "";
      const region = (scan.region as string) || "";
      const country = (scan.country as string) || "";
      if (!city && !region && !country) continue; // skip scans without geo data
      const key = `${city}|${region}|${country}`;
      if (!locationMap[key]) {
        locationMap[key] = { city, region, country, scans: 0, registered: 0 };
      }
      locationMap[key].scans++;
      if (scan.registered) locationMap[key].registered++;
    }

    // Scan timeline (grouped by date)
    const timelineMap: Record<string, { date: string; memberScans: number; churchScans: number; registered: number }> = {};
    for (const scan of scans.docs) {
      const dateStr = scan.scannedAt
        ? new Date(scan.scannedAt as string).toISOString().split("T")[0]
        : "unknown";
      if (!timelineMap[dateStr]) {
        timelineMap[dateStr] = { date: dateStr, memberScans: 0, churchScans: 0, registered: 0 };
      }
      if (scan.inviteType === "member") timelineMap[dateStr].memberScans++;
      else timelineMap[dateStr].churchScans++;
      if (scan.registered) timelineMap[dateStr].registered++;
    }
    const scanTimeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

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

    // --- New breakdowns ---

    // Helper: group scans by a string field
    const groupBy = (field: string): Record<string, { scans: number; registered: number }> => {
      const map: Record<string, { scans: number; registered: number }> = {};
      for (const scan of scans.docs) {
        const val = (scan[field as keyof typeof scan] as string) || "unknown";
        if (!map[val]) map[val] = { scans: 0, registered: 0 };
        map[val].scans++;
        if (scan.registered) map[val].registered++;
      }
      return map;
    };

    const toBreakdown = (map: Record<string, { scans: number; registered: number }>) =>
      Object.entries(map).map(([key, stats]) => ({
        name: key,
        scans: stats.scans,
        registered: stats.registered,
        conversionRate: stats.scans > 0 ? Math.round((stats.registered / stats.scans) * 100) : 0,
      }));

    const languageBreakdown = toBreakdown(groupBy("language"));
    const referrerBreakdown = toBreakdown(groupBy("referrer"));
    const utmSourceBreakdown = toBreakdown(groupBy("utmSource"));
    const utmCampaignBreakdown = toBreakdown(groupBy("utmCampaign"));
    const connectionTypeBreakdown = toBreakdown(groupBy("connectionType"));
    const gpuVendorBreakdown = toBreakdown(groupBy("gpuVendor"));
    const timezoneBreakdown = toBreakdown(groupBy("timezone"));

    // Behavioral metrics (only for registered scans with behavioral data)
    const registeredScans = scans.docs.filter((s) => s.registered);
    const timeOnPageValues = registeredScans
      .map((s) => s.timeOnPage as number)
      .filter((v): v is number => typeof v === "number" && v > 0);
    const scrollDepthValues = registeredScans
      .map((s) => s.scrollDepth as number)
      .filter((v): v is number => typeof v === "number" && v > 0);
    const formStartValues = registeredScans
      .map((s) => s.formStartDelay as number)
      .filter((v): v is number => typeof v === "number" && v >= 0);
    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    const behavioralMetrics = {
      avgTimeOnPage: avg(timeOnPageValues),
      avgScrollDepth: avg(scrollDepthValues),
      avgFormStartDelay: avg(formStartValues),
      rageClickCount: scans.docs.filter((s) => s.rageClickDetected).length,
      adBlockerDetectedCount: scans.docs.filter((s) => s.adBlockerDetected).length,
      sampleSize: timeOnPageValues.length,
    };

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
      osBreakdown: Object.entries(osMap).map(([os, stats]) => ({
        os,
        scans: stats.scans,
        registered: stats.registered,
        conversionRate: stats.scans > 0 ? Math.round((stats.registered / stats.scans) * 100) : 0,
      })),
      locationBreakdown: Object.values(locationMap)
        .sort((a, b) => b.scans - a.scans)
        .map((loc) => ({
          ...loc,
          conversionRate: loc.scans > 0 ? Math.round((loc.registered / loc.scans) * 100) : 0,
        })),
      scanTimeline,
      byChurch,
      byPlacement: Object.values(byPlacement),
      churchInviteCount: churchInvites.totalDocs,
      // New breakdowns
      languageBreakdown,
      referrerBreakdown,
      utmSourceBreakdown,
      utmCampaignBreakdown,
      connectionTypeBreakdown,
      gpuVendorBreakdown,
      timezoneBreakdown,
      behavioralMetrics,
    });
  } catch (error) {
    console.error("Scan stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
