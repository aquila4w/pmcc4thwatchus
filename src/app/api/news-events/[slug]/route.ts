import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { slug } = await params;

    // Find the news-event by slug
    const events = await payload.find({
      collection: "news-events",
      where: {
        slug: { equals: slug },
      },
      limit: 1,
      depth: 2, // Include related media
    });

    if (events.docs.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = events.docs[0] as Record<string, unknown>;

    // Process hero image
    const heroImage = event.heroImage as Record<string, unknown> | null;
    const heroImageData = heroImage ? {
      url: heroImage.url as string,
      alt: (heroImage.alt as string) || (event.title as string),
      width: heroImage.width as number,
      height: heroImage.height as number,
    } : null;

    // Process featured image
    const featuredImage = event.featuredImage as Record<string, unknown> | null;
    const featuredImageData = featuredImage ? {
      url: featuredImage.url as string,
      alt: (featuredImage.alt as string) || (event.title as string),
      width: featuredImage.width as number,
      height: featuredImage.height as number,
    } : null;

    // Process gallery images for carousel
    const gallery = event.gallery as Array<{ image: Record<string, unknown>; caption?: string }> | null;
    const galleryImages = gallery ? gallery.map((item) => ({
      url: item.image?.url as string,
      alt: (item.image?.alt as string) || item.caption || (event.title as string),
      caption: item.caption || "",
      width: item.image?.width as number,
      height: item.image?.height as number,
    })).filter(img => img.url) : [];

    // Process organizer
    const organizer = event.organizer as Record<string, unknown> | null;
    const organizerData = organizer ? {
      id: organizer.id,
      name: organizer.name as string,
    } : null;

    // Process tags
    const tags = event.tags as Array<Record<string, unknown>> | null;
    const tagsData = tags ? tags.map((tag) => ({
      id: tag.id,
      name: tag.name as string,
      slug: tag.slug as string,
      color: tag.color as string,
    })) : [];

    // Process categories
    const categories = event.categories as Array<Record<string, unknown>> | null;
    const categoriesData = categories ? categories.map((cat) => ({
      id: cat.id,
      name: cat.name as string,
      slug: cat.slug as string,
    })) : [];

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        subtitle: event.subtitle || "",
        slug: event.slug,
        description: event.description || "",
        eventDate: event.eventDate,
        endDate: event.endDate,
        location: event.location || "",
        address: event.address || "",
        coordinates: event.coordinates || null,
        eventType: event.eventType || "event",
        isPublished: event.isPublished,
        isFeatured: event.isFeatured,
        // Images
        heroImage: heroImageData,
        featuredImage: featuredImageData,
        gallery: galleryImages,
        // Organization
        organizer: organizerData,
        tags: tagsData,
        categories: categoriesData,
        // Contact
        contactEmail: event.contactEmail || null,
        contactPhone: event.contactPhone || null,
        // Puck visual builder data
        puckData: event.puckData || null,
        // Timestamps
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
    });
  } catch (error) {
    console.error("News-event fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
