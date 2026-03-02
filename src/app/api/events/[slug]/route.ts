import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const memberCode = searchParams.get("ref");

    // Find the event by slug
    const events = await payload.find({
      collection: "managed-events",
      where: {
        slug: { equals: slug },
      },
      limit: 1,
      depth: 2,
    });

    if (events.docs.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = events.docs[0];

    // Get registration count
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        event: { equals: event.id },
        status: { in: ["registered", "attended", "baptized"] },
      },
      limit: 0,
    });

    const registrationCount = registrations.totalDocs;
    const spotsRemaining = event.maxAttendees
      ? Math.max(0, event.maxAttendees - registrationCount)
      : null;

    // Check if registration is open
    const now = new Date();
    const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
    const isRegistrationOpen =
      event.status === "registration-open" &&
      event.registrationEnabled !== false &&
      (!deadline || now < deadline) &&
      (spotsRemaining === null || spotsRemaining > 0);

    // Get inviting member info if memberCode provided
    let invitedBy = null;
    if (memberCode) {
      const members = await payload.find({
        collection: "users",
        where: {
          inviteCode: { equals: memberCode },
        },
        limit: 1,
        depth: 1,
      });

      if (members.docs.length > 0) {
        const member = members.docs[0];
        const church = member.church as { name?: string } | null;
        invitedBy = {
          name: member.name,
          phone: member.phone,
          church: church?.name || null,
        };
      }
    }

    // Get hero image URL
    const heroImage = event.heroImage as { url?: string; filename?: string } | null;
    const heroImageUrl = heroImage?.url || heroImage?.filename
      ? `/media/${heroImage.filename}`
      : null;

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        address: event.address,
        coordinates: event.coordinates,
        heroImageUrl: heroImageUrl,
        hasBaptism: event.hasBaptism,
        eventType: event.eventType,
        registrationIntro: event.registrationIntro,
        thankYouTitle: event.thankYouTitle,
        thankYouMessage: event.thankYouMessage,
        showQRCode: event.showQRCode,
        customFields: event.registrationFields,
        // Puck visual builder data
        contentMode: event.contentMode || "richtext",
        puckData: event.puckData || null,
        pageLayout: event.pageLayout || null,
      },
      registration: {
        isOpen: isRegistrationOpen,
        spotsRemaining: spotsRemaining,
        totalRegistrations: registrationCount,
        maxAttendees: event.maxAttendees,
        deadline: event.registrationDeadline,
        requireApproval: event.requireApproval,
      },
      invitedBy: invitedBy,
    });
  } catch (error) {
    console.error("Event fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
