import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import type { Where } from "payload";
import { headers } from "next/headers";
import config from "@payload-config";

async function getCurrentUser() {
  const payload = await getPayload({ config });
  const headersList = await headers();
  const { user } = await payload.auth({ headers: headersList });
  return user;
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["superAdmin", "districtCoordinator"].includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const subDistricts = await payload.find({
      collection: "sub-districts",
      sort: "number",
      limit: 100,
    });

    const result = subDistricts.docs.map((sd) => ({
      id: sd.id,
      name: sd.name,
      number: sd.number,
      description: sd.description || null,
      coordinator: sd.coordinator
        ? typeof sd.coordinator === "object"
          ? { id: sd.coordinator.id, name: sd.coordinator.name }
          : { id: sd.coordinator, name: "" }
        : null,
    }));

    return NextResponse.json({ docs: result });
  } catch (error) {
    console.error("Failed to fetch sub-districts:", error);
    return NextResponse.json({ error: "Failed to fetch sub-districts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["superAdmin", "districtCoordinator"].includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const { name, number, coordinator, description } = await request.json();

    if (!name || !number) {
      return NextResponse.json({ error: "Name and number are required" }, { status: 400 });
    }

    const sd = await payload.create({
      collection: "sub-districts",
      data: {
        name,
        number: parseInt(number),
        coordinator: coordinator || undefined,
        description: description || undefined,
      },
    });

    return NextResponse.json({ success: true, id: sd.id });
  } catch (error) {
    console.error("Failed to create sub-district:", error);
    return NextResponse.json({ error: "Failed to create sub-district" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["superAdmin", "districtCoordinator"].includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const { id, name, number, coordinator, description } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (number !== undefined) updateData.number = parseInt(number);
    if (coordinator !== undefined) updateData.coordinator = coordinator || null;
    if (description !== undefined) updateData.description = description || null;

    await payload.update({
      collection: "sub-districts",
      id,
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update sub-district:", error);
    return NextResponse.json({ error: "Failed to update sub-district" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "superAdmin") {
      return NextResponse.json({ error: "Only superAdmin can delete" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Check if sub-district has churches
    const churchesInSD = await payload.find({
      collection: "churches",
      where: { subDistrict: { equals: id } },
      limit: 1,
    });

    if (churchesInSD.totalDocs > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${churchesInSD.totalDocs} church(es) are assigned to this sub-district. Reassign them first.` },
        { status: 400 }
      );
    }

    await payload.delete({ collection: "sub-districts", id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete sub-district:", error);
    return NextResponse.json({ error: "Failed to delete sub-district" }, { status: 500 });
  }
}
