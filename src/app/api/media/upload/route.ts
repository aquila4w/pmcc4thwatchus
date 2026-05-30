import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit by IP: 10 uploads per 15 minutes
  const clientIp = getClientIp(request);
  const { allowed, resetIn } = await rateLimitAsync(`media-upload:${clientIp}`, { windowMs: 15 * 60 * 1000, maxRequests: 10 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many upload requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      }
    );
  }

  try {
    const payload = await getPayload({ config });

    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the 10MB limit (uploaded: ${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    // Validate MIME type
    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
    ];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed. Accepted types: ${ALLOWED_MIME_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Sanitize alt text: trim whitespace and limit to 200 characters
    const rawAlt = (formData.get("alt") as string) || file.name;
    const alt = rawAlt.trim().substring(0, 200);

    // Convert File to Buffer for Payload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create media document via Payload
    const media = await payload.create({
      collection: "media",
      overrideAccess: true,
      data: {
        alt,
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    });

    // Build URL from the created media
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
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
