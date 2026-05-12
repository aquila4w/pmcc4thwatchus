import { NextRequest, NextResponse } from "next/server";
import { getPayload, Where } from "payload";
import config from "@/payload.config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);

    // Query parameters
    const type = searchParams.get("type"); // "news" or "event" or null for both
    const homepage = searchParams.get("homepage") === "true";
    const published = searchParams.get("published") !== "false"; // Default to true
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");
    const page = parseInt(searchParams.get("page") || "1");

    // Build where clause - using 'and' array for combining conditions
    const conditions: Where[] = [];

    // Filter by type (news or event)
    if (type && (type === "news" || type === "event")) {
      conditions.push({ type: { equals: type } });
    }

    // Filter by isPublished
    if (published) {
      conditions.push({ isPublished: { equals: true } });
    }

    // Filter by showOnHomepage
    if (homepage) {
      conditions.push({ showOnHomepage: { equals: true } });
    }

    // Filter by category (eventType - sub-category)
    if (category && category !== "All") {
      conditions.push({ eventType: { equals: category.toLowerCase() } });
    }

    // Filter by tag
    if (tag) {
      conditions.push({ "tags.slug": { equals: tag } });
    }

    // Search in title, subtitle, description, location
    if (search) {
      conditions.push({
        or: [
          { title: { contains: search } },
          { subtitle: { contains: search } },
          { description: { contains: search } },
          { location: { contains: search } },
        ],
      });
    }

    // Build final where clause
    const where: Where = conditions.length > 0 ? { and: conditions } : {};

    // Determine sort order based on type
    let sort: string;
    if (homepage) {
      sort = "homepageOrder"; // Sort by homepage order for homepage
    } else if (type === "news") {
      sort = "-newsDate"; // Sort by news date (newest first) for news
    } else {
      sort = "-eventDate"; // Sort by event date (upcoming first) for events
    }

    const newsEvents = await payload.find({
      collection: "news-events",
      where,
      sort,
      limit,
      page,
      depth: 2, // Include related media
    });

    // Transform the data for frontend
    const transformedEvents = newsEvents.docs.map((event: Record<string, unknown>) => ({
      id: event.id,
      type: event.type || "event",
      title: event.title,
      subtitle: event.subtitle || "",
      slug: event.slug,
      description: event.description || "",
      // News fields
      newsDate: event.newsDate,
      content: event.content,
      // Event fields
      startDate: event.eventDate, // Map eventDate to startDate for frontend compatibility
      endDate: event.endDate,
      location: event.location || "",
      address: event.address || "",
      coordinates: event.coordinates || null,
      // Common fields
      eventType: event.eventType || "general",
      heroImage: event.heroImage ? {
        url: (event.heroImage as Record<string, unknown>).url,
        alt: (event.heroImage as Record<string, unknown>).alt || event.title,
      } : null,
      featuredImage: event.featuredImage ? {
        url: (event.featuredImage as Record<string, unknown>).url,
        alt: (event.featuredImage as Record<string, unknown>).alt || event.title,
      } : null,
      gallery: Array.isArray(event.gallery) ? event.gallery.map((item: Record<string, unknown>) => ({
        image: item.image ? {
          url: (item.image as Record<string, unknown>).url,
          alt: (item.image as Record<string, unknown>).alt,
        } : null,
        caption: item.caption || "",
      })) : [],
      tags: Array.isArray(event.tags) ? event.tags.map((tag: Record<string, unknown>) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
      })) : [],
      categories: Array.isArray(event.categories) ? event.categories.map((cat: Record<string, unknown>) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      })) : [],
      isPublished: event.isPublished,
      showOnHomepage: event.showOnHomepage,
      homepageOrder: event.homepageOrder || 0,
      isFeatured: event.isFeatured || false,
      // Event registration fields
      requiresRegistration: event.requiresRegistration || false,
      registrationUrl: event.registrationUrl || "",
      registrationDeadline: event.registrationDeadline,
      maxAttendees: event.maxAttendees,
      registrationNote: event.registrationNote || "",
      organizer: event.organizer,
      contactEmail: event.contactEmail || "",
      contactPhone: event.contactPhone || "",
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));

    return NextResponse.json({
      items: transformedEvents,
      totalDocs: newsEvents.totalDocs,
      totalPages: newsEvents.totalPages,
      page: newsEvents.page,
      hasNextPage: newsEvents.hasNextPage,
      hasPrevPage: newsEvents.hasPrevPage,
    });
  } catch (error) {
    console.error("Error fetching news-events:", error);
    return NextResponse.json(
      { error: "Failed to fetch news and events" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/news-events
 * Creates a new news-event item (admin only)
 * Requires authentication in production
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });

    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: title and type are required" },
        { status: 400 }
      );
    }

    // Validate type
    if (body.type !== "news" && body.type !== "event") {
      return NextResponse.json(
        { error: "Type must be either 'news' or 'event'" },
        { status: 400 }
      );
    }

    // Generate slug from title if not provided
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug already exists
    const existing = await payload.find({
      collection: "news-events",
      where: { slug: { equals: slug } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      return NextResponse.json(
        { error: "An item with this slug already exists" },
        { status: 409 }
      );
    }

    // Create the news-event with only allowed fields
    const {
      title,
      description,
      summary,
      slug: bodySlug,
      type,
      category,
      tags,
      status,
      startDate,
      endDate,
      location,
      address,
      featured,
      coverImage,
      content,
    } = body;

    const result = await payload.create({
      collection: "news-events",
      data: {
        title,
        description,
        summary,
        slug,
        type,
        category,
        tags,
        status,
        startDate,
        endDate,
        location,
        address,
        featured,
        coverImage,
        content,
        isPublished: body.isPublished ?? true, // Default to published
      },
    });

    return NextResponse.json({ item: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating news-event:", error);
    return NextResponse.json(
      { error: "Failed to create news-event", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
