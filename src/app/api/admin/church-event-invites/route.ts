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
    const event = await payload.findByID({
      collection: "managed-events",
      id: eventId,
      depth: 0,
      overrideAccess: true,
    });

    // Fetch all active placements
    const placements = await payload.find({
      collection: "ad-placements",
      where: { status: { equals: "active" } },
      limit: 100,
      sort: "name",
      depth: 0,
      overrideAccess: true,
    });

    // Fetch all churches
    const churches = await payload.find({
      collection: "churches",
      limit: 200,
      sort: "name",
      depth: 0,
      overrideAccess: true,
    });

    // Fetch existing invites for this event (paginated to avoid limit cap)
    let allInvites: Record<string, unknown>[] = [];
    let page = 1;
    const pageSize = 500;
    let hasMore = true;
    while (hasMore) {
      const batch = await payload.find({
        collection: "church-event-invites",
        where: { event: { equals: eventId } },
        limit: pageSize,
        page,
        depth: 0,
        overrideAccess: true,
      });
      allInvites = allInvites.concat(batch.docs as Record<string, unknown>[]);
      hasMore = allInvites.length < batch.totalDocs;
      page++;
    }

    const inviteDocs = allInvites.map((inv) => ({
      id: inv.id,
      code: inv.code,
      church: inv.church as string,
      adPlacement: inv.adPlacement as string,
      contactName: inv.contactName || null,
      contactEmail: inv.contactEmail || null,
      contactPhone: inv.contactPhone || null,
      status: inv.status,
      scanCount: inv.scanCount || 0,
      registrationCount: inv.registrationCount || 0,
    }));

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
      },
      churches: churches.docs.map((c) => ({ id: c.id, name: c.name })),
      placements: placements.docs.map((p) => ({ id: p.id, name: p.name })),
      invites: inviteDocs,
    });
  } catch (error) {
    console.error("Failed to fetch church event invites:", error);
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
    const { id, status, contactName, contactEmail, contactPhone } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (contactName !== undefined) updateData.contactName = contactName || null;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail || null;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone || null;

    await payload.update({
      collection: "church-event-invites",
      id,
      data: updateData,
      depth: 0,
      overrideAccess: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update church event invite:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
