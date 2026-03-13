import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { inviteCode } = await params;

    // Find the event invite by UUID code
    const invites = await payload.find({
      collection: "event-invites",
      where: {
        and: [
          { inviteCode: { equals: inviteCode } },
          { status: { equals: "active" } },
        ],
      },
      limit: 1,
      depth: 2, // Include event, invitedBy, church
    });

    if (invites.docs.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired invite link" },
        { status: 404 }
      );
    }

    const invite = invites.docs[0];
    const event = invite.event as {
      id?: string;
      title?: string;
      slug?: string;
      description?: string;
      startDate?: string;
      location?: string;
      address?: string;
      eventType?: string;
      maxAttendees?: number;
      registrationDeadline?: string;
    } | null;

    const invitedBy = invite.invitedBy as {
      id?: string;
      name?: string;
      phone?: string;
      email?: string;
    } | null;

    const church = invite.church as {
      id?: string;
      name?: string;
    } | null;

    // Get registration count for this event
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        event: { equals: event?.id },
        status: { in: ["registered", "attended", "baptized"] },
      },
      limit: 0,
    });

    const registrationCount = registrations.totalDocs;
    const spotsRemaining = event?.maxAttendees
      ? Math.max(0, event.maxAttendees - registrationCount)
      : null;

    // Check if deadline has passed
    const now = new Date();
    const deadline = event?.registrationDeadline ? new Date(event.registrationDeadline) : null;
    const isPastDeadline = deadline && now > deadline;

    // Check if event is full
    const isFull = spotsRemaining === 0;

    // Get landing page configuration
    const fullEvent = await payload.findByID({
      collection: "managed-events",
      id: invite.event as string,
      depth: 0,
    });

    const landingPageHeroImage = fullEvent?.landingPageHeroImage as { url?: string; filename?: string } | null;
    const landingPageHeroImageUrl = landingPageHeroImage?.url || (landingPageHeroImage?.filename ? `/media/${landingPageHeroImage.filename}` : null);

    return NextResponse.json({
      invite: {
        id: invite.id,
        inviteCode: invite.inviteCode,
      },
      event: {
        id: event?.id,
        title: event?.title,
        slug: event?.slug,
        description: event?.description,
        startDate: event?.startDate,
        location: event?.location,
        address: event?.address,
        eventType: event?.eventType,
        spotsRemaining: spotsRemaining,
        isFull: isFull,
        isPastDeadline: isPastDeadline,
        landingPage: {
          heroImageUrl: landingPageHeroImageUrl,
          title: fullEvent?.landingPageTitle || "You're Registered!",
          content: fullEvent?.landingPageContent,
          showQR: fullEvent?.landingPageShowQR ?? true,
          showInviter: fullEvent?.landingPageShowInviter ?? true,
          cta: fullEvent?.landingPageCTA,
          ctaLink: fullEvent?.landingPageCTALink,
        },
      },
      invitedBy: {
        id: invitedBy?.id,
        name: invitedBy?.name,
        phone: invitedBy?.phone,
        email: invitedBy?.email,
        church: church?.name,
      },
      registrationCount: invite.registrationCount || 0,
    });
  } catch (error) {
    console.error("Event invite fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
