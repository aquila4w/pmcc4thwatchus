import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Where } from "payload";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";

// GET - List registrations for an event with filters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await getPayload({ config });

    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { eventId } = await params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const sort = searchParams.get("sort") || "-registeredAt";

    // Build where clause
    const where: Where = {
      and: [
        { event: { equals: eventId } },
      ],
    };

    if (status) {
      where.and?.push({ status: { equals: status } });
    }

    if (search) {
      where.and?.push({
        or: [
          { "guestInfo.name": { like: search } },
          { "guestInfo.email": { like: search } },
          { "guestInfo.phone": { like: search } },
          { inviteCode: { like: search } },
        ],
      });
    }

    const result = await payload.find({
      collection: "event-registrations",
      where,
      sort,
      limit,
      page,
      depth: 1,
    });

    return NextResponse.json({
      docs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
    });
  } catch (error) {
    console.error("Registrations list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}

// PATCH - Bulk update registration status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await getPayload({ config });

    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { eventId } = await params;
    const body = await request.json();

    const { registrationIds, status, notes } = body;

    if (!registrationIds || !Array.isArray(registrationIds)) {
      return NextResponse.json(
        { error: "registrationIds array is required" },
        { status: 400 }
      );
    }

    // Validate that all registration IDs belong to the specified event
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        and: [
          { id: { in: registrationIds } },
          { event: { equals: eventId } },
        ],
      },
      limit: registrationIds.length,
      depth: 0,
    });

    if (registrations.docs.length !== registrationIds.length) {
      return NextResponse.json(
        { error: "Some registration IDs do not belong to this event" },
        { status: 400 }
      );
    }

    // Update each registration
    const updatePromises = registrationIds.map((id: string) =>
      payload.update({
        collection: "event-registrations",
        id,
        data: {
          ...(status && { status }),
          ...(notes && { notes }),
        },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, updated: registrationIds.length });
  } catch (error) {
    console.error("Registrations update error:", error);
    return NextResponse.json(
      { error: "Failed to update registrations" },
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete registrations
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await getPayload({ config });

    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { eventId } = await params;
    const { searchParams } = new URL(request.url);

    const registrationIds = searchParams.get("ids")?.split(",");

    if (!registrationIds || registrationIds.length === 0) {
      return NextResponse.json(
        { error: "ids parameter is required" },
        { status: 400 }
      );
    }

    // Delete each registration
    const deletePromises = registrationIds.map((id) =>
      payload.delete({
        collection: "event-registrations",
        id,
      })
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ success: true, deleted: registrationIds.length });
  } catch (error) {
    console.error("Registrations delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete registrations" },
      { status: 500 }
    );
  }
}
