import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { countDocs } from "@/lib/analytics/get-model";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { code } = await params;

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    // Find the church event invite by code
    const invites = await payload.find({
      collection: "church-event-invites",
      where: {
        and: [
          { code: { equals: code } },
          { status: { equals: "active" } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (invites.docs.length === 0) {
      return NextResponse.json({ error: "Invalid or disabled church invite code" }, { status: 404 });
    }

    const churchInvite = invites.docs[0];

    // Fetch event details separately (depth:0)
    const event = await payload.findByID({
      collection: "managed-events",
      id: churchInvite.event as string,
      depth: 0,
      overrideAccess: true,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check event is still open for registration
    if (event.status !== "registration-open" && event.status !== "in-progress") {
      return NextResponse.json({ error: "Event is not open for registration" }, { status: 400 });
    }

    // Fetch hero image media URL separately
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

    // Fetch church details
    const church = await payload.findByID({
      collection: "churches",
      id: churchInvite.church as string,
      depth: 0,
      overrideAccess: true,
    });

    // Fetch ad placement details
    const adPlacement = await payload.findByID({
      collection: "ad-placements",
      id: churchInvite.adPlacement as string,
      depth: 0,
      overrideAccess: true,
    });

    // Get registration count and capacity info
    const registrationCount = await countDocs(payload, "event-registrations", {
      event: event.id,
      status: { $in: ["registered", "attended", "baptized"] },
    });
    const spotsRemaining = event.maxAttendees
      ? Math.max(0, event.maxAttendees - registrationCount)
      : null;
    const isPastDeadline = event.registrationDeadline
      ? new Date() > new Date(event.registrationDeadline)
      : false;
    const isFull = spotsRemaining === 0;

    // Resolve contact: invite-specific name only
    const contact = {
      name: churchInvite.contactName || null,
      phone: churchInvite.contactPhone || null,
      email: churchInvite.contactEmail || null,
    };

    return NextResponse.json({
      type: "church",
      churchInvite: {
        id: churchInvite.id,
        code: churchInvite.code,
      },
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
          showChurchDropdown: event.landingPageShowChurchDropdown ?? false,
        },
      },
      church: {
        id: church?.id,
        name: church?.name,
      },
      adPlacement: {
        id: adPlacement?.id,
        name: adPlacement?.name,
      },
      contact,
      registrationCount: churchInvite.registrationCount || 0,
      ...(event.landingPageShowChurchDropdown ? {
        churches: (await payload.find({
          collection: "churches",
          limit: 200,
          sort: "name",
          depth: 0,
          overrideAccess: true,
        })).docs.map((c: Record<string, unknown>) => ({ id: String(c.id), name: String(c.name) })),
      } : {}),
    });
  } catch (error) {
    console.error("Church invite lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
