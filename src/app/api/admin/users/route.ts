import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import type { Where } from "payload";
import config from "@payload-config";

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const church = searchParams.get("church") || "";

    const where: Where = {};

    if (search) {
      where.or = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = { equals: role };
    }

    if (status) {
      where.status = { equals: status };
    }

    if (church) {
      where.church = { equals: church };
    }

    const users = await payload.find({
      collection: "users",
      where,
      page,
      limit,
      sort: "-createdAt",
    });

    const result = users.docs.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || null,
      role: u.role,
      status: u.status,
      church: u.church
        ? typeof u.church === "object"
          ? { id: u.church.id, name: u.church.name }
          : { id: u.church, name: "" }
        : null,
      subDistrict: u.subDistrict
        ? typeof u.subDistrict === "object"
          ? { id: u.subDistrict.id, name: u.subDistrict.name || "" }
          : { id: u.subDistrict, name: "" }
        : null,
      authProvider: u.authProvider || null,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      docs: result,
      totalDocs: users.totalDocs,
      totalPages: users.totalPages,
      page: users.page,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await getPayload({ config });

    const { userId, role, status, church } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (church !== undefined) {
      updateData.church = church || null;
      // Auto-resolve sub-district from church
      if (church) {
        const churchDoc = await payload.findByID({
          collection: "churches",
          id: church,
        });
        if (churchDoc?.subDistrict) {
          updateData.subDistrict =
            typeof churchDoc.subDistrict === "object"
              ? churchDoc.subDistrict.id
              : churchDoc.subDistrict;
        }
      } else {
        updateData.subDistrict = null;
      }
    }

    const updatedUser = await payload.update({
      collection: "users",
      id: userId,
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getPayload({ config });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await payload.delete({
      collection: "users",
      id: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
