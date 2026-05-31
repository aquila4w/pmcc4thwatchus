import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { countDocs } from "@/lib/analytics/get-model";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const eventSlug = searchParams.get("eventSlug");

    const payload = await getPayload({ config });

    // Look up the platform event link by code
    const links = await payload.find({
      collection: "platform-event-links",
      where: {
        and: [
          { code: { equals: code.toUpperCase() } },
          { status: { equals: "active" } },
        ],
      },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    });

    if (links.totalDocs === 0) {
      return NextResponse.json({ error: "Invalid or disabled platform link" }, { status: 404 });
    }

    const link = links.docs[0];

    // Resolve event
    const event = typeof link.event === "object" && link.event
      ? link.event
      : await payload.findByID({
          collection: "managed-events",
          id: String(link.event),
          depth: 0,
          overrideAccess: true,
        });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // If eventSlug provided, verify it matches
    if (eventSlug && event.slug !== eventSlug) {
      return NextResponse.json({ error: "Event mismatch" }, { status: 400 });
    }

    // Resolve platform
    const platform = typeof link.platform === "object" && link.platform
      ? link.platform
      : await payload.findByID({
          collection: "online-platforms",
          id: String(link.platform),
          depth: 0,
          overrideAccess: true,
        });

    // Get registration count
    const registrationCount = await countDocs(payload, "event-registrations", {
      platformEventLink: link.id,
    });

    return NextResponse.json({
      link: {
        id: link.id,
        code: link.code,
        contactName: link.contactName || null,
        contactEmail: link.contactEmail || null,
        contactPhone: link.contactPhone || null,
      },
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description || "",
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location || "",
        address: event.address || "",
        heroImageUrl: event.heroImageUrl || null,
        hasBaptism: event.hasBaptism || false,
        eventType: event.eventType || "general",
        spotsRemaining: event.spotsRemaining || null,
        isFull: event.isFull || false,
        isPastDeadline: event.isPastDeadline || false,
        landingPage: event.landingPage || { title: "You're Registered!", showQR: true, showInviter: true },
      },
      platform: platform ? {
        id: platform.id,
        name: platform.name,
        slug: platform.slug,
      } : null,
      registrationCount,
    });
  } catch (error) {
    console.error("Failed to fetch platform link:", error);
    return NextResponse.json({ error: "Failed to fetch platform link" }, { status: 500 });
  }
}
