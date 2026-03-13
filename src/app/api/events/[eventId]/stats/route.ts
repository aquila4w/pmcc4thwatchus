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

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        hasBaptism: event.hasBaptism,
        maxAttendees: event.maxAttendees,
      },
      stats: {
        totalRegistrations,
        attendedCount,
        baptizedCount,
        notAttended: totalRegistrations - attendedCount,
        attendedNotBaptized: attendedCount - baptizedCount,
        spotsRemaining: event.maxAttendees
          ? Math.max(0, event.maxAttendees - totalRegistrations)
          : null,
      },
    });
  } catch (error) {
    console.error("Event stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
