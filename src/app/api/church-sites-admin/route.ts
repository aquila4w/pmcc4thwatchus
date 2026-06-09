import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === "http://localhost:3000") return true;
  return origin.endsWith(".pmcc4thwatch.us") || origin === "https://pmcc4thwatch.us";
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const headersList = request.headers;
    const { user } = await payload.auth({ headers: headersList });

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userRole = (user as Record<string, unknown>).role as string;
    const userChurch = (user as Record<string, unknown>).church as string;
    const userSubDistrict = (user as Record<string, unknown>).subDistrict as string;

    const canViewAll = ["superAdmin", "districtCoordinator"].includes(userRole);

    // Build filter based on role
    let where = {};
    if (!canViewAll && userRole === "subDistrictCoordinator" && userSubDistrict) {
      // SubDistrict coordinators see churches under their subDistrict
      where = { "church.subDistrict": { equals: userSubDistrict } };
    } else if (!canViewAll && userChurch) {
      // Head ministers, secretaries see only their church
      where = { church: { equals: userChurch } };
    }

    const result = await payload.find({
      collection: "church-sites",
      where,
      limit: 100,
      depth: 1,
    });

    return NextResponse.json({
      docs: result.docs,
      totalDocs: result.totalDocs,
    });
  } catch (error) {
    console.error("Church sites admin list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch church sites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const payload = await getPayload({ config });
    const headersList = request.headers;
    const { user } = await payload.auth({ headers: headersList });

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userRole = (user as Record<string, unknown>).role as string;
    const canCreate = ["superAdmin", "districtCoordinator"].includes(userRole);
    if (!canCreate) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.church || typeof body.church !== "string") {
      return NextResponse.json({ error: "Church ID required" }, { status: 400 });
    }

    const doc = await payload.create({
      collection: "church-sites",
      data: {
        church: body.church,
        template: typeof body.template === "string" ? body.template : "modern",
        published: false,
        welcomeTitle: "Welcome to Our Church",
      },
      depth: 1,
    });

    return NextResponse.json({ doc }, { status: 201 });
  } catch (error) {
    console.error("Church site creation error:", error);
    return NextResponse.json(
      { error: "Failed to create church site" },
      { status: 500 }
    );
  }
}
