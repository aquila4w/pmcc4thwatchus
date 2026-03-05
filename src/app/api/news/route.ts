import { NextRequest, NextResponse } from "next/server";
import { getPayload, Where } from "payload";
import config from "@/payload.config";

/**
 * GET /api/news
 * Returns only news items (type: "news"), not events
 */
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

    // ALWAYS filter by type: news (this endpoint only returns news)
    conditions.push({ type: { equals: "news" } });

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

    // Search in title, subtitle, description, content
    if (search) {
      conditions.push({
        or: [
          { title: { contains: search } },
          { subtitle: { contains: search } },
          { description: { contains: search } },
          { content: { contains: search } },
        ],
      });
    }

    // Build final where clause
    const where: Where = conditions.length > 0 ? { and: conditions } : {};

    // Determine sort order (news items sorted by newsDate or createdAt)
    const sort = homepage
      ? "homepageOrder" // Sort by homepage order for homepage
      : "-newsDate"; // Sort by news date (newest first)

    const news = await payload.find({
      collection: "news-events",
      where,
      sort,
      limit,
      page,
      depth: 2, // Include related media
    });

    // Transform the data for frontend
    const transformedNews = news.docs.map((item: Record<string, unknown>) => ({
      id: item.id,
      type: item.type || "news",
      title: item.title,
      subtitle: item.subtitle || "",
      slug: item.slug,
      description: item.description || "",
      newsDate: item.newsDate,
      content: item.content || "",
      eventType: item.eventType || "general",
      heroImage: item.heroImage ? {
        url: (item.heroImage as Record<string, unknown>).url,
        alt: (item.heroImage as Record<string, unknown>).alt || item.title,
      } : null,
      featuredImage: item.featuredImage ? {
        url: (item.featuredImage as Record<string, unknown>).url,
        alt: (item.featuredImage as Record<string, unknown>).alt || item.title,
      } : null,
      gallery: Array.isArray(item.gallery) ? item.gallery.map((galleryItem: Record<string, unknown>) => ({
        image: galleryItem.image ? {
          url: (galleryItem.image as Record<string, unknown>).url,
          alt: (galleryItem.image as Record<string, unknown>).alt,
        } : null,
        caption: galleryItem.caption || "",
      })) : [],
      tags: Array.isArray(item.tags) ? item.tags.map((tag: Record<string, unknown>) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
      })) : [],
      categories: Array.isArray(item.categories) ? item.categories.map((cat: Record<string, unknown>) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      })) : [],
      isPublished: item.isPublished,
      showOnHomepage: item.showOnHomepage,
      homepageOrder: item.homepageOrder || 0,
      isFeatured: item.isFeatured || false,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json({
      news: transformedNews,
      totalDocs: news.totalDocs,
      totalPages: news.totalPages,
      page: news.page,
      hasNextPage: news.hasNextPage,
      hasPrevPage: news.hasPrevPage,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
