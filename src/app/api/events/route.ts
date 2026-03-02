import { NextRequest, NextResponse } from "next/server";
import { getPayload, Where } from "payload";
import config from "@/payload.config";

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);

    // Query parameters
    const homepage = searchParams.get("homepage") === "true";
    const published = searchParams.get("published") !== "false"; // Default to true
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");
    const page = parseInt(searchParams.get("page") || "1");

    // Build where clause - using 'and' array for combining conditions
    const conditions: Where[] = [];

    // Filter by isPublished
    if (published) {
      conditions.push({ isPublished: { equals: true } });
    }

    // Filter by showOnHomepage
    if (homepage) {
      conditions.push({ showOnHomepage: { equals: true } });
    }

    // Filter by category
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

    // Determine sort order
    const sort = homepage
      ? "homepageOrder" // Sort by homepage order for homepage
      : "-eventDate"; // Sort by date (newest first) for events page

    const events = await payload.find({
      collection: "news-events",
      where,
      sort,
      limit,
      page,
      depth: 2, // Include related media
    });

    // Transform the data for frontend
    const transformedEvents = events.docs.map((event: Record<string, unknown>) => ({
      id: event.id,
      title: event.title,
      subtitle: event.subtitle || "",
      slug: event.slug,
      description: event.description || "",
      startDate: event.eventDate, // Map eventDate to startDate for frontend compatibility
      endDate: event.endDate,
      location: event.location || "",
      address: event.address || "",
      coordinates: event.coordinates || null,
      eventType: event.eventType || "event",
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
      requiresRegistration: event.requiresRegistration || false,
      registrationUrl: event.registrationUrl || "",
      registrationDeadline: event.registrationDeadline,
      contactEmail: event.contactEmail || "",
      contactPhone: event.contactPhone || "",
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));

    return NextResponse.json({
      events: transformedEvents,
      totalDocs: events.totalDocs,
      totalPages: events.totalPages,
      page: events.page,
      hasNextPage: events.hasNextPage,
      hasPrevPage: events.hasPrevPage,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
