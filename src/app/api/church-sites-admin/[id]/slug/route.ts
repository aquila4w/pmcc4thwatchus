import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

const ALLOWED_ROLES = ["superAdmin", "districtCoordinator"];

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === "http://localhost:3000") return true;
  return origin.endsWith(".pmcc4thwatch.us") || origin === "https://pmcc4thwatch.us";
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
      return NextResponse.json({ error: "Only admins can change subdomain slugs" }, { status: 403 });
    }

    const body = await request.json();
    const slug = (body.slug as string || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/(^-|-$)/g, "");

    if (!slug || slug.length < 2) {
      return NextResponse.json({ error: "Slug must be at least 2 characters" }, { status: 400 });
    }

    const RESERVED = ["www", "admin", "cms", "api", "mail", "staging", "dev", "app"];
    if (RESERVED.includes(slug)) {
      return NextResponse.json({ error: "This slug is reserved" }, { status: 400 });
    }

    // Get the church ID from the church-site
    const site = await payload.findByID({ collection: "church-sites", id, depth: 0 });
    const churchId = typeof site.church === "object"
      ? (site.church as { id: string }).id
      : (site.church as string);

    // Check for slug uniqueness
    const existing = await payload.find({
      collection: "churches",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    });
    if (existing.docs.length > 0 && existing.docs[0].id !== churchId) {
      return NextResponse.json({ error: "This slug is already taken by another church" }, { status: 409 });
    }

    await payload.update({
      collection: "churches",
      id: churchId,
      data: { slug },
    });

    return NextResponse.json({ slug });
  } catch (error) {
    console.error("Slug update error:", error);
    return NextResponse.json({ error: "Failed to update slug" }, { status: 500 });
  }
}
