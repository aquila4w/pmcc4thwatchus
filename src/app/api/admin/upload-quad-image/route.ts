import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import fs from "fs/promises";
import path from "path";

// This endpoint helps upload the quad events image as hero/featured image
// Only works in development or with proper authentication
export async function POST(request: NextRequest) {
  // Only allow in development or with proper auth
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const payload = await getPayload({ config });

    // Find the US District Quad Events
    const result: any = await payload.find({
      collection: "news-events",
      where: {
        slug: {
          equals: "us-district-quad-events-2026",
        },
      },
      depth: 0,
    });

    if (!result.docs || result.docs.length === 0) {
      return NextResponse.json(
        { error: "US District Quad Events not found. Please create it first." },
        { status: 404 }
      );
    }

    const newsEvent = result.docs[0];

    // Read the uploaded file from form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Please upload an image file." },
        { status: 400 }
      );
    }

    // Convert File to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create media entry
    const media = await payload.create({
      collection: "media",
      data: {
        alt: "US District Quad Events - Spiritual Empowerment Conference",
        caption: "US District Quad Events - March 18-25, 2026",
        newsEvent: newsEvent.id,
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: "us-district-quad-events-hero.jpg",
        size: buffer.length,
      },
    });

    // Update news-event with hero and featured images
    const updated = await payload.update({
      collection: "news-events",
      id: newsEvent.id,
      data: {
        heroImage: media.id,
        featuredImage: media.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Image uploaded and linked successfully",
      media: {
        id: media.id,
        url: media.url,
        alt: media.alt,
      },
      newsEvent: {
        id: updated.id,
        title: updated.title,
        heroImage: updated.heroImage,
        featuredImage: updated.featuredImage,
      },
    });

  } catch (error) {
    console.error("Error uploading quad image:", error);
    return NextResponse.json(
      {
        error: "Failed to upload image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check status
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const payload = await getPayload({ config });

    const result: any = await payload.find({
      collection: "news-events",
      where: {
        slug: {
          equals: "us-district-quad-events-2026",
        },
      },
      depth: 1, // Get related media info
    });

    if (!result.docs || result.docs.length === 0) {
      return NextResponse.json({
        found: false,
        message: "US District Quad Events not found",
      });
    }

    const newsEvent = result.docs[0];

    return NextResponse.json({
      found: true,
      newsEvent: {
        id: newsEvent.id,
        title: newsEvent.title,
        slug: newsEvent.slug,
        heroImage: newsEvent.heroImage,
        featuredImage: newsEvent.featuredImage,
      },
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
