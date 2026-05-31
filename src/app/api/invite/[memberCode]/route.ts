import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { countDocs } from "@/lib/analytics/get-model";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberCode: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { memberCode } = await params;

    // Find the member by invite code
    const members = await payload.find({
      collection: "users",
      where: {
        inviteCode: { equals: memberCode },
      },
      limit: 1,
      depth: 1,
    });

    if (members.docs.length === 0) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    const member = members.docs[0];
    const church = member.church as { name?: string } | null;

    // Find all events open for registration
    const events = await payload.find({
      collection: "managed-events",
      where: {
        status: { equals: "registration-open" },
        registrationEnabled: { equals: true },
      },
      sort: "startDate",
      limit: 20,
      depth: 1,
    });

    // Get registration counts for each event
    const eventsWithCounts = await Promise.all(
      events.docs.map(async (event) => {
        const registrationCount = await countDocs(payload, "event-registrations", {
          event: event.id,
          status: { $in: ["registered", "attended", "baptized"] },
        });
        const spotsRemaining = event.maxAttendees
          ? Math.max(0, event.maxAttendees - registrationCount)
          : null;

        // Check if deadline has passed
        const now = new Date();
        const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
        const isPastDeadline = deadline && now > deadline;

        // Skip events that are full or past deadline
        if (spotsRemaining === 0 || isPastDeadline) {
          return null;
        }

        const heroImage = event.heroImage as { url?: string; filename?: string } | null;
        const heroImageUrl = heroImage?.url || (heroImage?.filename ? `/media/${heroImage.filename}` : null);

        return {
          id: event.id,
          title: event.title,
          slug: event.slug,
          description: event.description,
          startDate: event.startDate,
          location: event.location,
          eventType: event.eventType || "general",
          spotsRemaining: spotsRemaining,
          heroImageUrl: heroImageUrl,
        };
      })
    );

    // Filter out null events (full or past deadline)
    const availableEvents = eventsWithCounts.filter(Boolean);

    return NextResponse.json({
      member: {
        name: member.name,
        phone: member.phone,
        church: church?.name || null,
      },
      events: availableEvents,
    });
  } catch (error) {
    console.error("Invite fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
