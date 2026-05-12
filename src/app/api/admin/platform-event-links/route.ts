import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { headers } from "next/headers";
import config from "@payload-config";

async function getCurrentUser() {
  const payload = await getPayload({ config });
  const headersList = await headers();
  const { user } = await payload.auth({ headers: headersList });
  return user;
}

const ALLOWED_ROLES = ["superAdmin", "districtCoordinator", "eventAdmin"];

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !ALLOWED_ROLES.includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    // Fetch event
    let event;
    try {
      event = await payload.findByID({
        collection: "managed-events",
        id: eventId,
        depth: 0,
        overrideAccess: true,
      });
    } catch {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch all active platforms
    const platforms = await payload.find({
      collection: "online-platforms",
      where: { status: { equals: "active" } },
      limit: 100,
      sort: "name",
      depth: 0,
      overrideAccess: true,
    });

    // Fetch existing links for this event
    const links = await payload.find({
      collection: "platform-event-links",
      where: { event: { equals: eventId } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    });

    const linkDocs = links.docs.map((link) => ({
      id: link.id,
      code: link.code,
      event: link.event as string,
      platform: link.platform as string,
      customUrl: link.customUrl || null,
      status: link.status,
      scanCount: link.scanCount || 0,
      registrationCount: link.registrationCount || 0,
    }));

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
      },
      platforms: platforms.docs.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        iconIdentifier: p.iconIdentifier,
        color: p.color || null,
      })),
      links: linkDocs,
    });
  } catch (error) {
    console.error("Failed to fetch platform event links:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !ALLOWED_ROLES.includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const { id, status, customUrl } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Validate status enum
    if (status !== undefined && !["active", "disabled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Validate customUrl format (must be https:// or relative path)
    if (customUrl !== undefined && customUrl !== null) {
      try {
        const parsed = new URL(customUrl);
        if (!["https:", "http:"].includes(parsed.protocol)) {
          return NextResponse.json({ error: "Custom URL must use http:// or https://" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid custom URL format" }, { status: 400 });
      }
    }

    // Verify link exists
    try {
      await payload.findByID({
        collection: "platform-event-links",
        id,
        depth: 0,
        overrideAccess: true,
      });
    } catch {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (customUrl !== undefined) updateData.customUrl = customUrl || null;

    await payload.update({
      collection: "platform-event-links",
      id,
      data: updateData,
      depth: 0,
      overrideAccess: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update platform event link:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !ALLOWED_ROLES.includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    // Fetch event
    let event;
    try {
      event = await payload.findByID({
        collection: "managed-events",
        id: eventId,
        depth: 0,
        overrideAccess: true,
      });
    } catch {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch all active platforms
    const platforms = await payload.find({
      collection: "online-platforms",
      where: { status: { equals: "active" } },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    });

    let created = 0;
    for (const platform of platforms.docs) {
      const existing = await payload.find({
        collection: "platform-event-links",
        where: {
          and: [
            { event: { equals: event.id } },
            { platform: { equals: platform.id } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });

      if (existing.totalDocs === 0) {
        await payload.create({
          collection: "platform-event-links",
          data: {
            event: event.id,
            platform: platform.id,
            status: "active",
          },
          depth: 0,
          overrideAccess: true,
        });
        created++;
      }
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error("Failed to generate platform event links:", error);
    return NextResponse.json({ error: "Failed to generate links" }, { status: 500 });
  }
}
