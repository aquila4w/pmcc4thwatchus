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

    // Find the post by slug
    const posts = await payload.find({
      collection: "posts",
      where: {
        slug: { equals: slug },
        status: { equals: "published" },
      },
      limit: 1,
      depth: 2,
    });

    if (posts.docs.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    const post = posts.docs[0];

    // Get featured image URL
    const featuredImage = post.featuredImage as { url?: string; filename?: string; alt?: string } | null;
    const featuredImageUrl = featuredImage?.url || (featuredImage?.filename ? `/media/${featuredImage.filename}` : null);

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        contentMode: post.contentMode || "richtext",
        puckData: post.puckData || null,
        pageLayout: post.pageLayout || null,
        featuredImage: featuredImage ? {
          url: featuredImageUrl,
          alt: featuredImage.alt || post.title,
        } : null,
        gallery: Array.isArray(post.gallery)
          ? post.gallery.map((item: { image?: { url?: string; filename?: string; alt?: string }; caption?: string }) => ({
              url: item.image?.url || (item.image?.filename ? `/media/${item.image.filename}` : null),
              alt: item.image?.alt || "",
              caption: item.caption || "",
            }))
          : [],
        author: post.author
          ? {
              id: (post.author as { id?: string }).id,
              name: (post.author as { name?: string }).name,
            }
          : null,
        categories: Array.isArray(post.categories)
          ? post.categories.map((cat) => ({
              id: (cat as { id?: string }).id,
              name: (cat as { name?: string }).name,
              slug: (cat as { slug?: string }).slug,
            }))
          : [],
        tags: Array.isArray(post.tags)
          ? post.tags.map((tag) => ({
              id: (tag as { id?: string }).id,
              name: (tag as { name?: string }).name,
              slug: (tag as { slug?: string }).slug,
            }))
          : [],
        isFeatured: post.isFeatured,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}
