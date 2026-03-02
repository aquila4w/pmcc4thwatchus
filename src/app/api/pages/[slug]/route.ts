import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { slug } = await params;

    // Find the page by slug
    const pages = await payload.find({
      collection: "pages",
      where: {
        slug: { equals: slug },
        status: { equals: "published" },
      },
      limit: 1,
      depth: 2,
    });

    if (pages.docs.length === 0) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    const page = pages.docs[0];

    // Get meta image URL
    const metaImage = page.meta as { title?: string; description?: string; image?: { url?: string; filename?: string; alt?: string }; keywords?: string } | null;
    const metaImageUrl = metaImage?.image?.url || (metaImage?.image?.filename ? `/media/${metaImage.image.filename}` : null);

    return NextResponse.json({
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        contentMode: page.contentMode || "blocks",
        layout: page.layout || null,
        puckData: page.puckData || null,
        content: page.content || null,
        isHomePage: page.isHomePage,
        showHeader: page.showHeader !== false, // Default to true
        showFooter: page.showFooter !== false, // Default to true
        customCSS: page.customCSS || null,
        meta: {
          title: metaImage?.title || page.title,
          description: metaImage?.description || "",
          image: metaImageUrl,
          keywords: metaImage?.keywords || "",
        },
        publishedAt: page.publishedAt,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}
