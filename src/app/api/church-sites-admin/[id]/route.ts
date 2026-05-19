import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

const ALLOWED_ROLES = ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"];
const CHURCH_SCOPED_ROLES = ["headMinister", "secretary"];
const SUBDISTRICT_SCOPED_ROLES = ["subDistrictCoordinator"];

const UPDATEABLE_FIELDS = [
  "published", "template", "heroImage", "welcomeTitle", "welcomeText",
  "missionStatement", "serviceSchedule", "pastors", "aboutContent",
  "history", "beliefs", "gallery", "socialLinks", "customColors",
  "latestUpdates",
];

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === "http://localhost:3000") return true;
  return origin.endsWith(".pmcc4thwatch.us") || origin === "https://pmcc4thwatch.us";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await getPayload({ config });
    const headersList = request.headers;
    const { user } = await payload.auth({ headers: headersList });

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userRole = (user as Record<string, unknown>).role as string;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const site = await payload.findByID({
      collection: "church-sites",
      id,
      depth: 1,
    });

    const siteChurchId = typeof site.church === "object"
      ? (site.church as { id: string }).id
      : (site.church as string);

    const userChurch = (user as Record<string, unknown>).church as string;
    if (CHURCH_SCOPED_ROLES.includes(userRole) && siteChurchId !== userChurch) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ site });
  } catch (error) {
    console.error("Church site get error:", error);
    return NextResponse.json({ error: "Failed to fetch site" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const { id } = await params;
    const payload = await getPayload({ config });
    const headersList = request.headers;
    const { user } = await payload.auth({ headers: headersList });

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userRole = (user as Record<string, unknown>).role as string;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const existingSite = await payload.findByID({
      collection: "church-sites",
      id,
      depth: 0,
    });

    const siteChurchId = typeof existingSite.church === "object"
      ? (existingSite.church as { id: string }).id
      : (existingSite.church as string);

    const userChurch = (user as Record<string, unknown>).church as string;
    if (CHURCH_SCOPED_ROLES.includes(userRole) && siteChurchId !== userChurch) {
      return NextResponse.json({ error: "You can only edit your own church's site" }, { status: 403 });
    }

    if (SUBDISTRICT_SCOPED_ROLES.includes(userRole)) {
      const churchDoc = await payload.findByID({ collection: "churches", id: siteChurchId, depth: 0 });
      const churchSD = typeof (churchDoc as Record<string, unknown>).subDistrict === "object"
        ? ((churchDoc as Record<string, unknown>).subDistrict as { id: string })?.id
        : (churchDoc as Record<string, unknown>).subDistrict as string;
      const userSubDistrict = (user as Record<string, unknown>).subDistrict as string;
      if (churchSD !== userSubDistrict) {
        return NextResponse.json({ error: "You can only edit sites in your sub-district" }, { status: 403 });
      }
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    for (const field of UPDATEABLE_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const result = await payload.update({
      collection: "church-sites",
      id,
      data: updateData,
      depth: 1,
    });

    return NextResponse.json({ site: result });
  } catch (error) {
    console.error("Church site update error:", error);
    return NextResponse.json({ error: "Failed to update site" }, { status: 500 });
  }
}
