import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import type { Where } from "payload";
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
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Build where clauses with optional date filters
    const scanWhere: Where = { event: { equals: eventId } };
    if (from) scanWhere.scannedAt = { greater_than_equal: from };
    if (to) {
      scanWhere.scannedAt = {
        ...(scanWhere.scannedAt as Record<string, unknown>),
        less_than_equal: to,
      };
    }

    const regWhere: Where = { event: { equals: eventId } };
    if (from) regWhere.createdAt = { greater_than_equal: from };
    if (to) {
      regWhere.createdAt = {
        ...(regWhere.createdAt as Record<string, unknown>),
        less_than_equal: to,
      };
    }

    // --- Fetch all data in parallel ---
    let event: Record<string, unknown> | null = null;
    try {
      event = await payload.findByID({ collection: "managed-events", id: eventId, depth: 0, overrideAccess: true });
    } catch {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const [
      scansResult,
      registrationsResult,
      eventInvitesResult,
      churchInvitesResult,
      platformLinksResult,
    ] = await Promise.all([
      payload.find({
        collection: "invite-scans",
        where: scanWhere,
        limit: 0,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: "event-registrations",
        where: regWhere,
        limit: 0,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: "event-invites",
        where: { event: { equals: eventId } },
        limit: 0,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: "church-event-invites",
        where: { event: { equals: eventId } },
        limit: 0,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: "platform-event-links",
        where: { event: { equals: eventId } },
        limit: 0,
        depth: 0,
        overrideAccess: true,
      }),
    ]);

    const scans = scansResult.docs;
    const registrations = registrationsResult.docs;
    const eventInvites = eventInvitesResult.docs;
    const churchInvites = churchInvitesResult.docs;
    const platformLinks = platformLinksResult.docs;

    // --- Classify scans by type ---
    const memberScans = scans.filter((s) => s.inviteType === "member");
    const churchScans = scans.filter((s) => s.inviteType === "church");
    const platformScans = scans.filter((s) => s.inviteType === "platform");

    // --- Overview metrics ---
    const totalRegistrations = registrationsResult.totalDocs;
    const attendedStatuses = ["attended", "baptized"];
    const attendedCount = registrations.filter((r) => attendedStatuses.includes(r.status as string)).length;
    const baptizedCount = registrations.filter((r) => r.status === "baptized").length;
    const waitlistedCount = registrations.filter((r) => r.status === "waitlisted").length;

    const statusDistribution: Record<string, number> = {};
    for (const reg of registrations) {
      const s = (reg.status as string) || "unknown";
      statusDistribution[s] = (statusDistribution[s] || 0) + 1;
    }

    // Conversion from scans → registrations (via invite-scans.registered boolean)
    const registeredFromScans = scans.filter((s) => s.registered).length;
    const overallConversionRate = scans.length > 0
      ? Math.round((registeredFromScans / scans.length) * 100)
      : 0;
    const attendanceRate = totalRegistrations > 0
      ? Math.round((attendedCount / totalRegistrations) * 100)
      : 0;
    const baptismRate = attendedCount > 0
      ? Math.round((baptizedCount / attendedCount) * 100)
      : 0;

    // --- Scan timeline ---
    const timelineMap: Record<string, { date: string; memberScans: number; churchScans: number; platformScans: number; registrations: number }> = {};
    for (const scan of scans) {
      const dateStr = scan.scannedAt
        ? new Date(scan.scannedAt as string).toISOString().split("T")[0]
        : "unknown";
      if (!timelineMap[dateStr]) {
        timelineMap[dateStr] = { date: dateStr, memberScans: 0, churchScans: 0, platformScans: 0, registrations: 0 };
      }
      if (scan.inviteType === "member") timelineMap[dateStr].memberScans++;
      else if (scan.inviteType === "church") timelineMap[dateStr].churchScans++;
      else if (scan.inviteType === "platform") timelineMap[dateStr].platformScans++;
      if (scan.registered) timelineMap[dateStr].registrations++;
    }
    const scanTimeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // --- Per-church with members ---
    // Build lookup maps
    const churchNameMap: Record<string, string> = {};
    const placementNameMap: Record<string, string> = {};
    const platformNameMap: Record<string, string> = {};

    // Resolve church names and placement names from church-event-invites
    const churchIds = [...new Set(churchInvites.map((ci) => ci.church as string).filter(Boolean))];
    const placementIds = [...new Set(churchInvites.map((ci) => ci.adPlacement as string).filter(Boolean))];
    const platformIds = [...new Set(platformLinks.map((pl) => pl.platform as string).filter(Boolean))];

    const [churchDocs, placementDocs, platformDocs] = await Promise.all([
      Promise.all(churchIds.map((id) =>
        payload.findByID({ collection: "churches", id, depth: 0, overrideAccess: true })
          .then((c) => { churchNameMap[id] = c?.name || id; })
          .catch(() => { churchNameMap[id] = id; })
      )),
      Promise.all(placementIds.map((id) =>
        payload.findByID({ collection: "ad-placements", id, depth: 0, overrideAccess: true })
          .then((p) => { placementNameMap[id] = p?.name || id; })
          .catch(() => { placementNameMap[id] = id; })
      )),
      Promise.all(platformIds.map((id) =>
        payload.findByID({ collection: "online-platforms", id, depth: 0, overrideAccess: true })
          .then((p) => { platformNameMap[id] = p?.name || id; })
          .catch(() => { platformNameMap[id] = id; })
      )),
    ]);

    // Group registrations by church (via invitedByChurch)
    const regsByChurch: Record<string, { total: number; attended: number; baptized: number; waitlisted: number }> = {};
    for (const reg of registrations) {
      const churchId = (reg.invitedByChurch as string) || "unknown";
      if (!regsByChurch[churchId]) regsByChurch[churchId] = { total: 0, attended: 0, baptized: 0, waitlisted: 0 };
      regsByChurch[churchId].total++;
      if (attendedStatuses.includes(reg.status as string)) regsByChurch[churchId].attended++;
      if (reg.status === "baptized") regsByChurch[churchId].baptized++;
      if (reg.status === "waitlisted") regsByChurch[churchId].waitlisted++;
    }

    // Also include registrations from church ads (sourceType = "church")
    // These have churchEventInvite but may not have invitedByChurch
    const regsByChurchInvite: Record<string, number> = {};
    for (const reg of registrations) {
      if (reg.churchEventInvite && !reg.invitedByChurch) {
        const ciId = reg.churchEventInvite as string;
        regsByChurchInvite[ciId] = (regsByChurchInvite[ciId] || 0) + 1;
      }
    }

    // Resolve church-event-invite → church for those registrations
    for (const [ciId, count] of Object.entries(regsByChurchInvite)) {
      const ci = churchInvites.find((c) => c.id === ciId);
      if (ci) {
        const churchId = ci.church as string;
        if (!regsByChurch[churchId]) regsByChurch[churchId] = { total: 0, attended: 0, baptized: 0, waitlisted: 0 };
        regsByChurch[churchId].total += count;
      }
    }

    // Group scans by church
    const scansByChurch: Record<string, number> = {};
    for (const scan of churchScans) {
      // Find the church from the churchEventInvite
      const ciId = scan.churchEventInvite as string;
      const ci = churchInvites.find((c) => c.id === ciId);
      if (ci) {
        const churchId = ci.church as string;
        scansByChurch[churchId] = (scansByChurch[churchId] || 0) + 1;
      }
    }
    // Also count member scans towards their church
    const memberScansByChurch: Record<string, number> = {};
    for (const scan of memberScans) {
      const eiId = scan.eventInvite as string;
      const ei = eventInvites.find((e) => e.id === eiId);
      if (ei) {
        const churchId = ei.church as string;
        memberScansByChurch[churchId] = (memberScansByChurch[churchId] || 0) + 1;
      }
    }

    // Build per-member data grouped by church
    const membersByChurch: Record<string, {
      memberId: string; memberName: string; inviteCode: string;
      scans: number; registrations: number; conversionRate: number;
    }[]> = {};

    for (const ei of eventInvites) {
      const churchId = (ei.church as string) || "unknown";
      const memberName = (ei.memberContactName as string) || "Unknown Member";
      const inviteCode = ei.inviteCode as string;
      const memberId = String(ei.invitedBy || ei.id);

      // Count scans for this invite
      const inviteScans = memberScans.filter((s) => s.eventInvite === ei.id);
      const inviteScanCount = inviteScans.length;

      // Count registrations for this invite
      const inviteRegs = registrations.filter((r) => r.eventInvite === ei.id);
      const inviteRegCount = inviteRegs.length;
      const convRate = inviteScanCount > 0
        ? Math.round((inviteRegCount / inviteScanCount) * 100)
        : 0;

      if (!membersByChurch[churchId]) membersByChurch[churchId] = [];
      membersByChurch[churchId].push({
        memberId,
        memberName,
        inviteCode,
        scans: inviteScanCount,
        registrations: inviteRegCount,
        conversionRate: convRate,
      });
    }

    // Assemble byChurch
    const allChurchIds = new Set([
      ...Object.keys(regsByChurch),
      ...Object.keys(scansByChurch),
      ...Object.keys(memberScansByChurch),
      ...Object.keys(membersByChurch),
    ]);

    const byChurch = Array.from(allChurchIds).map((churchId) => {
      const regData = regsByChurch[churchId] || { total: 0, attended: 0, baptized: 0, waitlisted: 0 };
      const churchScanCount = scansByChurch[churchId] || 0;
      const memberScanCount = memberScansByChurch[churchId] || 0;
      const totalScanCount = churchScanCount + memberScanCount;
      const convRate = totalScanCount > 0
        ? Math.round((regData.total / totalScanCount) * 100)
        : 0;

      return {
        churchId,
        churchName: churchNameMap[churchId] || churchId,
        registrations: regData.total,
        scans: totalScanCount,
        conversionRate: convRate,
        attendedCount: regData.attended,
        baptizedCount: regData.baptized,
        members: (membersByChurch[churchId] || []).sort((a, b) => b.registrations - a.registrations),
      };
    }).sort((a, b) => b.registrations - a.registrations);

    // --- Per-placement ---
    const scansByPlacement: Record<string, { scans: number; registered: number }> = {};
    for (const scan of churchScans) {
      const ciId = scan.churchEventInvite as string;
      const ci = churchInvites.find((c) => c.id === ciId);
      if (ci) {
        const placementId = ci.adPlacement as string;
        if (!scansByPlacement[placementId]) scansByPlacement[placementId] = { scans: 0, registered: 0 };
        scansByPlacement[placementId].scans++;
        if (scan.registered) scansByPlacement[placementId].registered++;
      }
    }

    const regsByPlacement: Record<string, number> = {};
    for (const reg of registrations) {
      if (reg.sourceType === "church" && reg.churchEventInvite) {
        const ciId = reg.churchEventInvite as string;
        const ci = churchInvites.find((c) => c.id === ciId);
        if (ci) {
          const placementId = ci.adPlacement as string;
          regsByPlacement[placementId] = (regsByPlacement[placementId] || 0) + 1;
        }
      }
    }

    const allPlacementIds = new Set([
      ...Object.keys(scansByPlacement),
      ...Object.keys(regsByPlacement),
    ]);

    const byPlacement = Array.from(allPlacementIds).map((placementId) => {
      const scanData = scansByPlacement[placementId] || { scans: 0, registered: 0 };
      const regCount = regsByPlacement[placementId] || 0;
      return {
        placementId,
        placementName: placementNameMap[placementId] || placementId,
        scans: scanData.scans,
        registrations: regCount,
        conversionRate: scanData.scans > 0 ? Math.round((regCount / scanData.scans) * 100) : 0,
      };
    }).sort((a, b) => b.scans - a.scans);

    // --- Per-platform ---
    const scansByPlatform: Record<string, number> = {};
    for (const scan of platformScans) {
      const plId = scan.platformEventLink as string;
      const pl = platformLinks.find((p) => p.id === plId);
      if (pl) {
        const platformId = pl.platform as string;
        scansByPlatform[platformId] = (scansByPlatform[platformId] || 0) + 1;
      }
    }

    const regsByPlatform: Record<string, number> = {};
    for (const reg of registrations) {
      if (reg.platformEventLink) {
        const plId = reg.platformEventLink as string;
        const pl = platformLinks.find((p) => p.id === plId);
        if (pl) {
          const platformId = pl.platform as string;
          regsByPlatform[platformId] = (regsByPlatform[platformId] || 0) + 1;
        }
      }
    }

    const allPlatformIds = new Set([
      ...Object.keys(scansByPlatform),
      ...Object.keys(regsByPlatform),
    ]);

    const byPlatform = Array.from(allPlatformIds).map((platformId) => {
      const scanCount = scansByPlatform[platformId] || 0;
      const regCount = regsByPlatform[platformId] || 0;
      return {
        platformId,
        platformName: platformNameMap[platformId] || platformId,
        scans: scanCount,
        registrations: regCount,
        conversionRate: scanCount > 0 ? Math.round((regCount / scanCount) * 100) : 0,
      };
    }).sort((a, b) => b.scans - a.scans);

    // --- Device/Browser/OS breakdowns ---
    const groupAndCount = (field: string) => {
      const map: Record<string, { scans: number; registered: number }> = {};
      for (const scan of scans) {
        const val = (scan[field as keyof typeof scan] as string) || "unknown";
        if (!map[val]) map[val] = { scans: 0, registered: 0 };
        map[val].scans++;
        if (scan.registered) map[val].registered++;
      }
      return Object.entries(map).map(([name, stats]) => ({
        name,
        scans: stats.scans,
        registered: stats.registered,
        conversionRate: stats.scans > 0 ? Math.round((stats.registered / stats.scans) * 100) : 0,
      }));
    };

    const deviceBreakdown = groupAndCount("device");
    const browserBreakdown = groupAndCount("browser");
    const osBreakdown = groupAndCount("os");

    // --- Location breakdown ---
    const locationMap: Record<string, { city: string; region: string; country: string; scans: number; registered: number }> = {};
    for (const scan of scans) {
      const city = (scan.city as string) || "";
      const region = (scan.region as string) || "";
      const country = (scan.country as string) || "";
      if (!city && !region && !country) continue;
      const key = `${city}|${region}|${country}`;
      if (!locationMap[key]) locationMap[key] = { city, region, country, scans: 0, registered: 0 };
      locationMap[key].scans++;
      if (scan.registered) locationMap[key].registered++;
    }
    const locationBreakdown = Object.values(locationMap)
      .sort((a, b) => b.scans - a.scans)
      .map((loc) => ({ ...loc, conversionRate: loc.scans > 0 ? Math.round((loc.registered / loc.scans) * 100) : 0 }));

    // --- Behavioral metrics ---
    const registeredScans = scans.filter((s) => s.registered);
    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
    const timeOnPageValues = registeredScans.map((s) => s.timeOnPage as number).filter((v): v is number => typeof v === "number" && v > 0);
    const scrollDepthValues = registeredScans.map((s) => s.scrollDepth as number).filter((v): v is number => typeof v === "number" && v > 0);
    const formStartValues = registeredScans.map((s) => s.formStartDelay as number).filter((v): v is number => typeof v === "number" && v >= 0);

    const behavioralMetrics = {
      avgTimeOnPage: avg(timeOnPageValues),
      avgScrollDepth: avg(scrollDepthValues),
      avgFormStartDelay: avg(formStartValues),
      rageClickCount: scans.filter((s) => s.rageClickDetected).length,
      adBlockerDetectedCount: scans.filter((s) => s.adBlockerDetected).length,
      sampleSize: timeOnPageValues.length,
    };

    return NextResponse.json({
      overview: {
        totalRegistrations,
        attendedCount,
        baptizedCount,
        waitlistedCount,
        totalScans: scans.length,
        memberScans: memberScans.length,
        churchScans: churchScans.length,
        platformScans: platformScans.length,
        overallConversionRate,
        attendanceRate,
        baptismRate,
        statusDistribution,
        spotsRemaining: event?.maxAttendees
          ? Math.max(0, event.maxAttendees - totalRegistrations)
          : null,
        eventTitle: event?.title || null,
        eventStartDate: event?.startDate || null,
        eventLocation: event?.location || null,
      },
      byChurch,
      byPlacement,
      byPlatform,
      scanTimeline,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      locationBreakdown,
      behavioralMetrics,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
