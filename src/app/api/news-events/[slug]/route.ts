import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

/**
 * GET /api/news-events/[slug]
 * Returns a single news event or news item by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { slug } = await params;

    // Find the news-event by slug
    const items = await payload.find({
      collection: "news-events",
      where: {
        slug: { equals: slug },
      },
      limit: 1,
      depth: 2, // Include related media
    });

    if (items.docs.length === 0) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    const item = items.docs[0] as Record<string, unknown>;
    const itemType = item.type as string || "event";

    // Process hero image
    const heroImage = item.heroImage as Record<string, unknown> | null;
    const heroImageData = heroImage ? {
      url: heroImage.url as string,
      alt: (heroImage.alt as string) || (item.title as string),
      width: heroImage.width as number,
      height: heroImage.height as number,
    } : null;

    // Process featured image
    const featuredImage = item.featuredImage as Record<string, unknown> | null;
    const featuredImageData = featuredImage ? {
      url: featuredImage.url as string,
      alt: (featuredImage.alt as string) || (item.title as string),
      width: featuredImage.width as number,
      height: featuredImage.height as number,
    } : null;

    // Process gallery images for carousel
    const gallery = item.gallery as Array<{ image: Record<string, unknown>; caption?: string }> | null;
    const galleryImages = gallery ? gallery.map((galleryItem) => ({
      url: galleryItem.image?.url as string,
      alt: (galleryItem.image?.alt as string) || galleryItem.caption || (item.title as string),
      caption: galleryItem.caption || "",
      width: galleryItem.image?.width as number,
      height: galleryItem.image?.height as number,
    })).filter(img => img.url) : [];

    // Process organizer (events only)
    const organizer = item.organizer as Record<string, unknown> | null;
    const organizerData = organizer ? {
      id: organizer.id,
      name: organizer.name as string,
    } : null;

    // Process tags
    const tags = item.tags as Array<Record<string, unknown>> | null;
    const tagsData = tags ? tags.map((tag) => ({
      id: tag.id,
      name: tag.name as string,
      slug: tag.slug as string,
      color: tag.color as string,
    })) : [];

    // Process categories
    const categories = item.categories as Array<Record<string, unknown>> | null;
    const categoriesData = categories ? categories.map((cat) => ({
      id: cat.id,
      name: cat.name as string,
      slug: cat.slug as string,
    })) : [];

    // Build response object with type-specific fields
    const response: Record<string, unknown> = {
      id: item.id,
      type: itemType,
      title: item.title,
      subtitle: item.subtitle || "",
      slug: item.slug,
      description: item.description || "",
      eventType: item.eventType || "general",
      isPublished: item.isPublished,
      isFeatured: item.isFeatured,
      // Images
      heroImage: heroImageData,
      featuredImage: featuredImageData,
      gallery: galleryImages,
      // Organization
      organizer: organizerData,
      tags: tagsData,
      categories: categoriesData,
      // Timestamps
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    // Add event-specific fields
    if (itemType === "event") {
      response.eventDate = item.eventDate;
      response.endDate = item.endDate;
      response.location = item.location || "";
      response.address = item.address || "";
      response.coordinates = item.coordinates || null;
      response.requiresRegistration = item.requiresRegistration || false;
      response.registrationUrl = item.registrationUrl || "";
      response.registrationDeadline = item.registrationDeadline;
      response.maxAttendees = item.maxAttendees;
      response.registrationNote = item.registrationNote || "";
      response.contactEmail = item.contactEmail || null;
      response.contactPhone = item.contactPhone || null;
    }

    // Add news-specific fields
    if (itemType === "news") {
      response.newsDate = item.newsDate;
      response.content = item.content || "";
    }

    return NextResponse.json({ item: response });
  } catch (error) {
    console.error("News-event fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
