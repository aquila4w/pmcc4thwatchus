import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { wrap, cacheKeys, invalidateEventCache } from "@/lib/cache";
import { countDocs } from "@/lib/analytics/get-model";

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
        const totalRegistrations = await countDocs(payload, "event-registrations", {
          event: eventId,
        });

        // Get attended count
        const attendedCount = await countDocs(payload, "event-registrations", {
          event: eventId,
          status: { $in: ["attended", "baptized"] },
        });

        // Get baptized count
        const baptizedCount = await countDocs(payload, "event-registrations", {
          event: eventId,
          status: "baptized",
        });

        // Get waitlisted count
        const waitlistedCount = await countDocs(payload, "event-registrations", {
          event: eventId,
          status: "waitlisted",
        });

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
