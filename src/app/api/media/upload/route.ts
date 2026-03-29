import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert File to Buffer for Payload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create media document via Payload
    const media = await payload.create({
      collection: "media",
      overrideAccess: true,
      data: {
        alt: formData.get("alt") as string || file.name,
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    });

    // Build URL from the created media
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || request.headers.get("origin") || "";
    const mediaDoc = media as unknown as { url?: string; filename?: string };
    const mediaUrl = mediaDoc.url
      ? `${baseUrl}${mediaDoc.url}`
      : null;

    return NextResponse.json({
      id: media.id,
      url: mediaUrl,
      filename: (media as { filename?: string }).filename,
    }, { status: 201 });
  } catch (error) {
    console.error("Media upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload media";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
