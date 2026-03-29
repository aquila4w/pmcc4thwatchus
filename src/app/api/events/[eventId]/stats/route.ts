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

    // Get event details
    const event = await payload.findByID({
      collection: "managed-events",
      id: eventId,
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
    });
  } catch (error) {
    console.error("Event stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
