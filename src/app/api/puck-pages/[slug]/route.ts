import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

// GET - Get a single Puck page by slug or ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { slug } = await params;

    // First try to find by slug
    let pages = await payload.find({
      collection: "puck-pages",
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    });

    // If not found by slug, try by ID
    if (pages.docs.length === 0) {
      try {
        const pageById = await payload.findByID({
          collection: "puck-pages",
          id: slug,
        });
        if (pageById) {
          pages = { docs: [pageById], totalDocs: 1, limit: 1, page: 1, pagingCounter: 1, hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null, totalPages: 1 };
        }
      } catch {
        // ID lookup failed, page doesn't exist
      }
    }

    if (pages.docs.length === 0) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    const page = pages.docs[0];

    return NextResponse.json({
      page: {
        id: page.id,
        name: page.name,
        slug: page.slug,
        status: page.status,
        puckData: page.puckData,
        description: page.description,
        publishedAt: page.publishedAt,
        updatedAt: page.updatedAt,
        createdAt: page.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching puck page:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

// PUT - Update a Puck page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { slug } = await params;
    const body = await request.json();

    // Find the page first
    let pages = await payload.find({
      collection: "puck-pages",
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    });

    // If not found by slug, try by ID
    if (pages.docs.length === 0) {
      try {
        const pageById = await payload.findByID({
          collection: "puck-pages",
          id: slug,
        });
        if (pageById) {
          pages = { docs: [pageById], totalDocs: 1, limit: 1, page: 1, pagingCounter: 1, hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null, totalPages: 1 };
        }
      } catch {
        // ID lookup failed
      }
    }

    if (pages.docs.length === 0) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    const existingPage = pages.docs[0];

    // Check if slug is being changed and if new slug already exists
    if (body.slug && body.slug !== existingPage.slug) {
      const slugExists = await payload.find({
        collection: "puck-pages",
        where: {
          slug: { equals: body.slug },
          id: { not_equals: existingPage.id },
        },
        limit: 1,
      });

      if (slugExists.docs.length > 0) {
        return NextResponse.json(
          { error: "A page with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Update the page
    const updatedPage = await payload.update({
      collection: "puck-pages",
      id: existingPage.id,
      data: {
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.puckData && { puckData: body.puckData }),
        ...(body.status && { status: body.status }),
        ...(body.description !== undefined && { description: body.description }),
      },
    });

    return NextResponse.json({
      success: true,
      page: {
        id: updatedPage.id,
        name: updatedPage.name,
        slug: updatedPage.slug,
        status: updatedPage.status,
        updatedAt: updatedPage.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating puck page:", error);
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a Puck page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { slug } = await params;

    // Find the page first
    let pages = await payload.find({
      collection: "puck-pages",
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    });

    // If not found by slug, try by ID
    if (pages.docs.length === 0) {
      try {
        const pageById = await payload.findByID({
          collection: "puck-pages",
          id: slug,
        });
        if (pageById) {
          pages = { docs: [pageById], totalDocs: 1, limit: 1, page: 1, pagingCounter: 1, hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null, totalPages: 1 };
        }
      } catch {
        // ID lookup failed
      }
    }

    if (pages.docs.length === 0) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    const existingPage = pages.docs[0];

    await payload.delete({
      collection: "puck-pages",
      id: existingPage.id,
    });

    return NextResponse.json({
      success: true,
      message: "Page deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting puck page:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
