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

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !ALLOWED_ROLES.includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const placements = await payload.find({
      collection: "ad-placements",
      sort: "name",
      limit: 100,
      depth: 0,
      overrideAccess: true,
    });

    const result = placements.docs.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || null,
      status: p.status,
    }));

    return NextResponse.json({ docs: result });
  } catch (error) {
    console.error("Failed to fetch ad placements:", error);
    return NextResponse.json({ error: "Failed to fetch ad placements" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !ALLOWED_ROLES.includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const { name, description, status } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const placement = await payload.create({
      collection: "ad-placements",
      data: {
        name,
        description: description || undefined,
        status: status || "active",
      },
      depth: 0,
      overrideAccess: true,
    });

    return NextResponse.json({ success: true, id: placement.id });
  } catch (error) {
    console.error("Failed to create ad placement:", error);
    return NextResponse.json({ error: "Failed to create ad placement" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !ALLOWED_ROLES.includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const { id, name, description, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) updateData.status = status;

    await payload.update({
      collection: "ad-placements",
      id,
      data: updateData,
      depth: 0,
      overrideAccess: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update ad placement:", error);
    return NextResponse.json({ error: "Failed to update ad placement" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["superAdmin", "districtCoordinator"].includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Only superAdmin/districtCoordinator can delete" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Check for associated church-event-invites
    const invites = await payload.find({
      collection: "church-event-invites",
      where: { adPlacement: { equals: id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (invites.totalDocs > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${invites.totalDocs} church invite code(s) reference this placement. Disable it instead.` },
        { status: 400 }
      );
    }

    await payload.delete({ collection: "ad-placements", id, depth: 0, overrideAccess: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete ad placement:", error);
    return NextResponse.json({ error: "Failed to delete ad placement" }, { status: 500 });
  }
}
