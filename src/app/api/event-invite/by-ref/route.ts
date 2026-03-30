import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const eventSlug = searchParams.get("eventSlug");

    if (!code || !eventSlug) {
      return NextResponse.json(
        { error: "Missing code or eventSlug parameter" },
        { status: 400 }
      );
    }

    // Find member by their personal inviteCode
    const members = await payload.find({
      collection: "users",
      where: { inviteCode: { equals: code } },
      limit: 1,
      depth: 0,
    });

    if (members.docs.length === 0) {
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 }
      );
    }

    const member = members.docs[0];

    // Find event by slug — depth 1 to populate heroImage upload
    const events = await payload.find({
      collection: "managed-events",
      where: { slug: { equals: eventSlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (events.docs.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = events.docs[0];

    // Fetch heroImage media URL separately (depth:0 returns just the ID)
    let heroImageUrl: string | null = null;
    if (event.heroImage) {
      try {
        const media = await payload.findByID({
          collection: "media",
          id: event.heroImage as string,
          depth: 0,
          overrideAccess: true,
        });
        heroImageUrl = media?.url || null;
      } catch {
        heroImageUrl = null;
      }
    }

    // Find the EventInvite for this member + event
    const invites = await payload.find({
      collection: "event-invites",
      where: {
        and: [
          { event: { equals: event.id } },
          { invitedBy: { equals: member.id } },
        ],
      },
      limit: 1,
      depth: 0,
    });

    const eventInvite = invites.docs.length > 0 ? invites.docs[0] : null;

    // Get registration count and capacity info
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        event: { equals: event.id },
        status: { in: ["registered", "attended", "baptized"] },
      },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    });

    const registrationCount = registrations.totalDocs;
    const spotsRemaining = event.maxAttendees
      ? Math.max(0, event.maxAttendees - registrationCount)
      : null;
    const isPastDeadline = event.registrationDeadline
      ? new Date() > new Date(event.registrationDeadline)
      : false;
    const isFull = spotsRemaining === 0;

    // Get member's church
    const church = member.church as { id?: string; name?: string } | null;
    const churchObj = typeof church === "object" ? church : null;

    return NextResponse.json({
      invite: eventInvite
        ? { id: eventInvite.id, inviteCode: eventInvite.inviteCode }
        : { id: null, inviteCode: code },
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        address: event.address,
        eventType: event.eventType,
        heroImageUrl,
        hasBaptism: event.hasBaptism,
        spotsRemaining,
        isFull,
        isPastDeadline,
        landingPage: {
          title: event.landingPageTitle || "You're Registered!",
          content: event.landingPageContent,
          showQR: event.landingPageShowQR ?? true,
          showInviter: event.landingPageShowInviter ?? true,
        },
      },
      invitedBy: {
        id: member.id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        church: churchObj?.name,
      },
      registrationCount: eventInvite?.registrationCount || 0,
    });
  } catch (error) {
    console.error("Event invite by-ref error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
