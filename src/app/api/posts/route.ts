import { NextRequest, NextResponse } from "next/server";
import { getPayload, Where } from "payload";
import config from "@payload-config";

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);

    // Query parameters
    const featured = searchParams.get("featured") === "true";
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const page = Number.parseInt(searchParams.get("page") || "1", 10);

    // Build where clause
    const conditions: Where[] = [
      { status: { equals: "published" } },
    ];

    if (featured) {
      conditions.push({ isFeatured: { equals: true } });
    }

    if (category) {
      conditions.push({ "categories.slug": { equals: category } });
    }

    if (tag) {
      conditions.push({ "tags.slug": { equals: tag } });
    }

    if (search) {
      conditions.push({
        or: [
          { title: { contains: search } },
          { excerpt: { contains: search } },
        ],
      });
    }

    const where: Where = conditions.length > 1 ? { and: conditions } : conditions[0];

    const posts = await payload.find({
      collection: "posts",
      where,
      sort: "-publishedAt",
      limit,
      page,
      depth: 2,
    });

    // Transform the data
    const transformedPosts = posts.docs.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      featuredImage: post.featuredImage
        ? {
            url: (post.featuredImage as { url?: string }).url,
            alt: (post.featuredImage as { alt?: string }).alt || post.title,
          }
        : null,
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
      contentMode: post.contentMode || "richtext",
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    return NextResponse.json({
      posts: transformedPosts,
      totalDocs: posts.totalDocs,
      totalPages: posts.totalPages,
      page: posts.page,
      hasNextPage: posts.hasNextPage,
      hasPrevPage: posts.hasPrevPage,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
