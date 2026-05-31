import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { countDocs } from "@/lib/analytics/get-model";

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

    // Fetch hero image URL separately (depth:0 returns just the ID)
    let heroImageUrl: string | null = null;
    if (fullEvent?.heroImage) {
      try {
        const media = await payload.findByID({
          collection: "media",
          id: fullEvent.heroImage as string,
          depth: 0,
          overrideAccess: true,
        });
        heroImageUrl = media?.url || null;
      } catch { /* no image */ }
    }

    // Get registration count for this event
    const registrationCount = await countDocs(payload, "event-registrations", {
      event: eventId,
      status: { $in: ["registered", "attended", "baptized"] },
    });
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
        heroImageUrl: heroImageUrl,
        hasBaptism: fullEvent?.hasBaptism,
        spotsRemaining: spotsRemaining,
        isFull: isFull,
        isPastDeadline: isPastDeadline,
        landingPage: {
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
