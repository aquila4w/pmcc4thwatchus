import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { wrap, cacheKeys, invalidateEventCache } from "@/lib/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { eventId } = await params;

    // Cache the entire stats response for 10 seconds.
    // The booth page polls this frequently — most hits will be cache hits.
    // After any write (check-in, baptism, registration, walk-in), the caller
    // invalidates the cache so the next poll gets fresh data.
    const stats = await wrap(
      cacheKeys.eventStats(eventId),
      10, // 10-second TTL — near-real-time for booth operators
      async () => {
        const payload = await getPayload({ config });

        // Get event details
        const event = await payload.findByID({
          collection: "managed-events",
          id: eventId,
          depth: 0,
          overrideAccess: true,
        });

        if (!event) return null;

        // Get registration stats
        const registrations = await payload.find({
          collection: "event-registrations",
          where: {
            event: { equals: eventId },
          },
          limit: 0,
          depth: 0,
          overrideAccess: true,
        });

        const totalRegistrations = registrations.totalDocs;

        // Get attended count
        const attended = await payload.find({
          collection: "event-registrations",
          where: {
            and: [
              { event: { equals: eventId } },
              { status: { in: ["attended", "baptized"] } },
            ],
          },
          limit: 0,
          depth: 0,
          overrideAccess: true,
        });

        const attendedCount = attended.totalDocs;

        // Get baptized count
        const baptized = await payload.find({
          collection: "event-registrations",
          where: {
            and: [
              { event: { equals: eventId } },
              { status: { equals: "baptized" } },
            ],
          },
          limit: 0,
          depth: 0,
          overrideAccess: true,
        });

        const baptizedCount = baptized.totalDocs;

        // Get waitlisted count
        const waitlisted = await payload.find({
          collection: "event-registrations",
          where: {
            and: [
              { event: { equals: eventId } },
              { status: { equals: "waitlisted" } },
            ],
          },
          limit: 0,
          depth: 0,
          overrideAccess: true,
        });

        const waitlistedCount = waitlisted.totalDocs;

        return {
          totalRegistrations,
          attendedCount,
          baptizedCount,
          waitlistedCount,
          notAttended: totalRegistrations - attendedCount,
          attendedNotBaptized: attendedCount - baptizedCount,
          spotsRemaining: event.maxAttendees
            ? Math.max(0, event.maxAttendees - totalRegistrations)
            : null,
          // Booth page needs these
          eventTitle: event.title || null,
          walkInCode: event.walkInEnabled ? (event.walkInCode || null) : null,
          hasBaptism: event.hasBaptism || false,
        };
      },
    );

    if (!stats) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Event stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
