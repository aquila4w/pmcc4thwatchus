import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import type { Where } from "payload";
import { headers } from "next/headers";
import config from "@payload-config";

const ROLE_HIERARCHY = [
  "superAdmin",
  "districtCoordinator",
  "subDistrictCoordinator",
  "eventAdmin",
  "headMinister",
  "secretary",
  "member",
  "guest",
];

function getHiddenRoles(myRole: string): string[] {
  if (myRole === "superAdmin") return [];
  if (myRole === "districtCoordinator") return ["superAdmin"];
  return ["superAdmin", "districtCoordinator"];
}

function getAssignableRoles(myRole: string): string[] {
  switch (myRole) {
    case "superAdmin":
      return ROLE_HIERARCHY;
    case "districtCoordinator":
      return ROLE_HIERARCHY.filter((r) => r !== "superAdmin");
    case "subDistrictCoordinator":
      return ["headMinister", "secretary", "member", "guest"];
    case "headMinister":
    case "secretary":
      return ["member", "guest"];
    case "eventAdmin":
      return ["member", "guest"];
    default:
      return [];
  }
}

async function getCurrentUser() {
  const payload = await getPayload({ config });
  const headersList = await headers();
  const { user } = await payload.auth({ headers: headersList });
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const myRole = currentUser.role as string;
    const myChurch = (currentUser.church as { id?: string } | undefined)?.id || currentUser.church;
    const mySubDistrict = (currentUser.subDistrict as { id?: string } | undefined)?.id || currentUser.subDistrict;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const church = searchParams.get("church") || "";

    const conditions: Where[] = [];

    // Role-based filtering: hide higher roles
    const hiddenRoles = getHiddenRoles(myRole);
    for (const hr of hiddenRoles) {
      conditions.push({ role: { not_equals: hr } });
    }

    // Church-level roles: only see their own church
    if (["headMinister", "secretary"].includes(myRole)) {
      if (myChurch) {
        conditions.push({ church: { equals: myChurch } });
      }
    }

    // Sub-district coordinator: only see users in their sub-district
    if (myRole === "subDistrictCoordinator") {
      if (mySubDistrict) {
        conditions.push({ subDistrict: { equals: mySubDistrict } });
      }
    }

    if (search) {
      conditions.push({
        or: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      });
    }

    if (role) {
      conditions.push({ role: { equals: role } });
    }

    if (status) {
      conditions.push({ status: { equals: status } });
    }

    if (church) {
      conditions.push({ church: { equals: church } });
    }

    const where: Where =
      conditions.length === 0
        ? {}
        : conditions.length === 1
          ? conditions[0]
          : { and: conditions };

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
          ? { id: (u.church as { id: string }).id, name: (u.church as { name: string }).name }
          : { id: u.church as string, name: "" }
        : null,
      subDistrict: u.subDistrict
        ? typeof u.subDistrict === "object"
          ? { id: (u.subDistrict as { id: string }).id, name: (u.subDistrict as { name: string }).name || "" }
          : { id: u.subDistrict as string, name: "" }
        : null,
      authProvider: u.authProvider || null,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      docs: result,
      totalDocs: users.totalDocs,
      totalPages: users.totalPages,
      page: users.page,
      currentUserRole: myRole,
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const myRole = currentUser.role as string;
    const myChurch = (currentUser.church as { id?: string } | undefined)?.id || currentUser.church;
    const mySubDistrict = (currentUser.subDistrict as { id?: string } | undefined)?.id || currentUser.subDistrict;

    const { userId, role, status, church } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Verify target user is within scope
    const targetUser = await payload.findByID({ collection: "users", id: userId });
    const hiddenRoles = getHiddenRoles(myRole);

    if (hiddenRoles.includes(targetUser.role as string)) {
      return NextResponse.json({ error: "Cannot edit this user" }, { status: 403 });
    }

    if (["headMinister", "secretary"].includes(myRole)) {
      const targetChurch =
        typeof targetUser.church === "object"
          ? (targetUser.church as { id?: string })?.id
          : targetUser.church;
      if (targetChurch !== myChurch) {
        return NextResponse.json({ error: "Cannot edit users outside your church" }, { status: 403 });
      }
    }

    if (myRole === "subDistrictCoordinator") {
      const targetSD =
        typeof targetUser.subDistrict === "object"
          ? (targetUser.subDistrict as { id?: string })?.id
          : targetUser.subDistrict;
      if (targetSD !== mySubDistrict) {
        return NextResponse.json({ error: "Cannot edit users outside your sub-district" }, { status: 403 });
      }
    }

    // Restrict which roles can be assigned
    const assignableRoles = getAssignableRoles(myRole);
    if (role !== undefined && !assignableRoles.includes(role)) {
      return NextResponse.json(
        { error: `You cannot assign the "${role}" role` },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (church !== undefined) {
      updateData.church = church || null;
      if (church) {
        const churchDoc = await payload.findByID({
          collection: "churches",
          id: church,
        });
        if (churchDoc?.subDistrict) {
          updateData.subDistrict =
            typeof churchDoc.subDistrict === "object"
              ? (churchDoc.subDistrict as { id: string }).id
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
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const myRole = currentUser.role as string;

    // Only superAdmin and districtCoordinator can delete
    if (!["superAdmin", "districtCoordinator"].includes(myRole)) {
      return NextResponse.json({ error: "Not authorized to delete users" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const targetUser = await payload.findByID({ collection: "users", id: userId });
    const hiddenRoles = getHiddenRoles(myRole);
    if (hiddenRoles.includes(targetUser.role as string)) {
      return NextResponse.json({ error: "Cannot delete this user" }, { status: 403 });
    }

    await payload.delete({ collection: "users", id: userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
