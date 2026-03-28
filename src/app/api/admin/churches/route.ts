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

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["superAdmin", "districtCoordinator"].includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const churches = await payload.find({
      collection: "churches",
      sort: "name",
      limit: 200,
    });

    const result = churches.docs.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      city: c.city || null,
      state: c.state || null,
      address: c.address || null,
      zip: c.zip || null,
      phone: c.phone || null,
      email: c.email || null,
      subDistrict: c.subDistrict
        ? typeof c.subDistrict === "object"
          ? { id: (c.subDistrict as { id: string }).id, name: (c.subDistrict as { name: string }).name }
          : { id: c.subDistrict as string, name: "" }
        : null,
      headMinister: c.headMinister
        ? typeof c.headMinister === "object"
          ? { id: (c.headMinister as { id: string }).id, name: (c.headMinister as { name: string }).name }
          : { id: c.headMinister as string, name: "" }
        : null,
      secretary: c.secretary
        ? typeof c.secretary === "object"
          ? { id: (c.secretary as { id: string }).id, name: (c.secretary as { name: string }).name }
          : { id: c.secretary as string, name: "" }
        : null,
    }));

    return NextResponse.json({ docs: result });
  } catch (error) {
    console.error("Failed to fetch churches:", error);
    return NextResponse.json({ error: "Failed to fetch churches" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["superAdmin", "districtCoordinator"].includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const data = await request.json();

    if (!data.name || !data.slug || !data.city || !data.state || !data.subDistrict) {
      return NextResponse.json(
        { error: "Name, slug, city, state, and sub-district are required" },
        { status: 400 }
      );
    }

    const church = await payload.create({
      collection: "churches",
      data: {
        name: data.name,
        slug: data.slug,
        city: data.city,
        state: data.state,
        address: data.address || undefined,
        zip: data.zip || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        subDistrict: data.subDistrict,
        headMinister: data.headMinister || undefined,
        secretary: data.secretary || undefined,
      },
    });

    return NextResponse.json({ success: true, id: church.id });
  } catch (error) {
    console.error("Failed to create church:", error);
    return NextResponse.json({ error: "Failed to create church" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["superAdmin", "districtCoordinator"].includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    const { id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    const fields = ["name", "slug", "city", "state", "address", "zip", "phone", "email", "subDistrict", "headMinister", "secretary"];
    for (const field of fields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field] || null;
      }
    }

    await payload.update({
      collection: "churches",
      id,
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update church:", error);
    return NextResponse.json({ error: "Failed to update church" }, { status: 500 });
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

    // Check if church has members/ministers
    const usersInChurch = await payload.find({
      collection: "users",
      where: { church: { equals: id } },
      limit: 1,
    });

    if (usersInChurch.totalDocs > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${usersInChurch.totalDocs} user(s) are assigned to this church. Remove or reassign them first.` },
        { status: 400 }
      );
    }

    await payload.delete({ collection: "churches", id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete church:", error);
    return NextResponse.json({ error: "Failed to delete church" }, { status: 500 });
  }
}
