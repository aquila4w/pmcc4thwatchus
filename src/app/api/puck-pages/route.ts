import { NextRequest, NextResponse } from "next/server";
import { getPayload, Where } from "payload";
import config from "@payload-config";

// GET - List all Puck pages
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);

    const where: Where = status
      ? { status: { equals: status } }
      : {};

    const pages = await payload.find({
      collection: "puck-pages",
      where,
      limit,
      sort: "-updatedAt",
    });

    return NextResponse.json({
      pages: pages.docs.map((page) => ({
        id: page.id,
        name: page.name,
        slug: page.slug,
        status: page.status,
        description: page.description,
        updatedAt: page.updatedAt,
        createdAt: page.createdAt,
      })),
      totalDocs: pages.totalDocs,
    });
  } catch (error) {
    console.error("Error fetching puck pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

// POST - Create a new Puck page
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const body = await request.json();

    const { name, slug, puckData, status = "draft", description } = body;

    if (!name || !puckData) {
      return NextResponse.json(
        { error: "Name and puckData are required" },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const finalSlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existing = await payload.find({
      collection: "puck-pages",
      where: {
        slug: { equals: finalSlug },
      },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 400 }
      );
    }

    const page = await payload.create({
      collection: "puck-pages",
      data: {
        name,
        slug: finalSlug,
        puckData,
        status,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      page: {
        id: page.id,
        name: page.name,
        slug: page.slug,
        status: page.status,
      },
    });
  } catch (error) {
    console.error("Error creating puck page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}
