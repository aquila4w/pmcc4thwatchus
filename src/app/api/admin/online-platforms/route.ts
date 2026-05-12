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
    const platforms = await payload.find({
      collection: "online-platforms",
      sort: "name",
      limit: 100,
      depth: 0,
      overrideAccess: true,
    });

    const result = platforms.docs.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      iconIdentifier: p.iconIdentifier,
      description: p.description || null,
      urlTemplate: p.urlTemplate || null,
      color: p.color || null,
      status: p.status,
    }));

    return NextResponse.json({ docs: result });
  } catch (error) {
    console.error("Failed to fetch online platforms:", error);
    return NextResponse.json({ error: "Failed to fetch online platforms" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !ALLOWED_ROLES.includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const { name, iconIdentifier, description, urlTemplate, color, status } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Validate status
    if (status && !["active", "disabled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Validate color format
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json({ error: "Color must be a hex color (e.g., #1877F2)" }, { status: 400 });
    }

    // Check for duplicate name
    const existing = await payload.find({
      collection: "online-platforms",
      where: { name: { equals: name.trim() } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (existing.totalDocs > 0) {
      return NextResponse.json({ error: `Platform "${name.trim()}" already exists` }, { status: 409 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const platform = await payload.create({
      collection: "online-platforms",
      data: {
        name: name.trim(),
        slug,
        iconIdentifier: iconIdentifier || slug,
        description: description || undefined,
        urlTemplate: urlTemplate || undefined,
        color: color || undefined,
        status: status || "active",
      },
      depth: 0,
      overrideAccess: true,
    });

    return NextResponse.json({ success: true, id: platform.id });
  } catch (error) {
    console.error("Failed to create online platform:", error);
    return NextResponse.json({ error: "Failed to create online platform" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !ALLOWED_ROLES.includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const { id, name, iconIdentifier, description, urlTemplate, color, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Validate status
    if (status && !["active", "disabled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Validate color format
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json({ error: "Color must be a hex color (e.g., #1877F2)" }, { status: 400 });
    }

    // Verify the platform exists
    const existing = await payload.findByID({
      collection: "online-platforms",
      id,
      depth: 0,
      overrideAccess: true,
    }).catch(() => null);

    if (!existing) {
      return NextResponse.json({ error: "Platform not found" }, { status: 404 });
    }

    // Check for duplicate name (if renaming)
    if (name && name.trim() !== existing.name) {
      const duplicate = await payload.find({
        collection: "online-platforms",
        where: {
          and: [
            { name: { equals: name.trim() } },
            { id: { not_equals: id } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });

      if (duplicate.totalDocs > 0) {
        return NextResponse.json({ error: `Platform "${name.trim()}" already exists` }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      updateData.name = name.trim();
      updateData.slug = name.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (iconIdentifier !== undefined) updateData.iconIdentifier = iconIdentifier;
    if (description !== undefined) updateData.description = description || null;
    if (urlTemplate !== undefined) updateData.urlTemplate = urlTemplate || null;
    if (color !== undefined) updateData.color = color || null;
    if (status !== undefined) updateData.status = status;

    await payload.update({
      collection: "online-platforms",
      id,
      data: updateData,
      depth: 0,
      overrideAccess: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update online platform:", error);
    return NextResponse.json({ error: "Failed to update online platform" }, { status: 500 });
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

    // Check for associated platform-event-links
    const links = await payload.find({
      collection: "platform-event-links",
      where: { platform: { equals: id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (links.totalDocs > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${links.totalDocs} platform event link(s) reference this platform. Disable it instead.` },
        { status: 400 }
      );
    }

    await payload.delete({ collection: "online-platforms", id, depth: 0, overrideAccess: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete online platform:", error);
    return NextResponse.json({ error: "Failed to delete online platform" }, { status: 500 });
  }
}
