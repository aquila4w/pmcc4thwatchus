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

    // Get event details
    const event = await payload.findByID({
      collection: "managed-events",
      id: eventId,
      depth: 0,
      overrideAccess: true,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Event stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
