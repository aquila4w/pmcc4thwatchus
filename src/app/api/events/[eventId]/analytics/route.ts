import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { getOverview } from "@/lib/analytics/overview-pipeline";
import { getChurches } from "@/lib/analytics/churches-pipeline";
import { getPlacements } from "@/lib/analytics/placements-pipeline";
import { getPlatforms } from "@/lib/analytics/platforms-pipeline";
import { getTechnical } from "@/lib/analytics/technical-pipeline";

// Allow up to 60s for analytics aggregation under heavy load (Vercel Pro)
export const maxDuration = 60;

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
    const section = searchParams.get("section"); // overview|churches|placements|platforms|technical

    // Fetch event details (always needed)
    let event: Record<string, unknown> | null = null;
    try {
      event = await payload.findByID({ collection: "managed-events", id: eventId, depth: 0, overrideAccess: true });
    } catch {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventData = {
      title: event?.title as string | undefined,
      startDate: event?.startDate as string | undefined,
      location: event?.location as string | undefined,
      maxAttendees: event?.maxAttendees as number | undefined,
    };

    // Route to the appropriate pipeline based on section
    if (section === "churches") {
      const [overviewResult, byChurch] = await Promise.all([
        getOverview(eventId, eventData, from, to),
        getChurches(eventId, from, to),
      ]);
      return NextResponse.json({ overview: overviewResult.overview, byChurch });
    }

    if (section === "placements") {
      const [overviewResult, byPlacement] = await Promise.all([
        getOverview(eventId, eventData, from, to),
        getPlacements(eventId, from, to),
      ]);
      return NextResponse.json({ overview: overviewResult.overview, byPlacement });
    }

    if (section === "platforms") {
      const [overviewResult, byPlatform] = await Promise.all([
        getOverview(eventId, eventData, from, to),
        getPlatforms(eventId, from, to),
      ]);
      return NextResponse.json({ overview: overviewResult.overview, byPlatform });
    }

    if (section === "technical") {
      const [overviewResult, technical] = await Promise.all([
        getOverview(eventId, eventData, from, to),
        getTechnical(eventId, from, to),
      ]);
      return NextResponse.json({
        overview: overviewResult.overview,
        deviceBreakdown: technical.deviceBreakdown,
        browserBreakdown: technical.browserBreakdown,
        osBreakdown: technical.osBreakdown,
        locationBreakdown: technical.locationBreakdown,
        behavioralMetrics: technical.behavioralMetrics,
      });
    }

    // Default: overview only (or full if no section param and backward compat)
    const overviewResult = await getOverview(eventId, eventData, from, to);

    if (section === "overview" || !section) {
      // For lazy-loading, return just overview.
      // For backward compat (no section param), return overview + timeline.
      return NextResponse.json({
        overview: overviewResult.overview,
        scanTimeline: overviewResult.scanTimeline,
      });
    }

    return NextResponse.json(overviewResult);
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
