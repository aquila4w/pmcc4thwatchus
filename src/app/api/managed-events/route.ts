import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Where } from "payload";

// GET - List all managed events with filters
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "999");
    const sort = searchParams.get("sort") || "-startDate";
    const page = parseInt(searchParams.get("page") || "1");
    const depth = parseInt(searchParams.get("depth") || "1");

    // Build where clause
    const where: Where = {};

    if (status) {
      where.status = { equals: status };
    }

    if (search) {
      where.or = [
        { title: { like: search } },
        { location: { like: search } },
        { description: { like: search } },
      ];
    }

    const result = await payload.find({
      collection: "managed-events",
      where,
      sort,
      limit,
      page,
      depth,
    });

    return NextResponse.json({
      docs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error("Managed events list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch managed events" },
      { status: 500 }
    );
  }
}

// POST - Create a new managed event
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const body = await request.json();

    // Auto-generate slug from title if not provided
    if (body.title && !body.slug) {
      body.slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const result = await payload.create({
      collection: "managed-events",
      data: body,
      depth: 1,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Managed event creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
