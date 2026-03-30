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
      depth: 0,
      overrideAccess: true,
    });

    if (invites.docs.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired invite link" },
        { status: 404 }
      );
    }

    const invite = invites.docs[0];
    const eventId = invite.event as string;
    const invitedById = invite.invitedBy as string;

    // Get full event details (depth:0 to avoid R2 hang)
    const fullEvent = await payload.findByID({
      collection: "managed-events",
      id: eventId,
      depth: 0,
      overrideAccess: true,
    });

    // Get inviter details
    const inviter = await payload.findByID({
      collection: "users",
      id: invitedById,
      depth: 1,
    }).catch(() => null);

    // Get inviter's church name
    let inviterChurch: string | null = null;
    if (inviter?.church) {
      try {
        const churchDoc = await payload.findByID({
          collection: "churches",
          id: inviter.church as string,
          depth: 0,
          overrideAccess: true,
        });
        inviterChurch = churchDoc?.name || null;
      } catch { /* no church */ }
    }

    // Fetch landing page hero image URL separately
    let landingPageHeroImageUrl: string | null = null;
    if (fullEvent?.landingPageHeroImage) {
      try {
        const media = await payload.findByID({
          collection: "media",
          id: fullEvent.landingPageHeroImage as string,
          depth: 0,
          overrideAccess: true,
        });
        landingPageHeroImageUrl = media?.url || null;
      } catch { /* no image */ }
    }

    // Get registration count for this event
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        event: { equals: eventId },
        status: { in: ["registered", "attended", "baptized"] },
      },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    });

    const registrationCount = registrations.totalDocs;
    const spotsRemaining = fullEvent?.maxAttendees
      ? Math.max(0, fullEvent.maxAttendees - registrationCount)
      : null;

    // Check if deadline has passed
    const now = new Date();
    const deadline = fullEvent?.registrationDeadline ? new Date(fullEvent.registrationDeadline) : null;
    const isPastDeadline = deadline && now > deadline;

    // Check if event is full
    const isFull = spotsRemaining === 0;

    return NextResponse.json({
      invite: {
        id: invite.id,
        inviteCode: invite.inviteCode,
      },
      event: {
        id: eventId,
        title: fullEvent?.title,
        slug: fullEvent?.slug,
        description: fullEvent?.description,
        startDate: fullEvent?.startDate,
        location: fullEvent?.location,
        address: fullEvent?.address,
        eventType: fullEvent?.eventType,
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
        id: inviter?.id,
        name: inviter?.name,
        phone: inviter?.phone,
        email: inviter?.email,
        church: inviterChurch,
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
