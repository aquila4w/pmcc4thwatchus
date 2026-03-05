import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: filePath } = await params;
  const fullPath = path.join(process.cwd(), "media", ...filePath);

  // Security check: ensure the path doesn't escape the media folder
  const resolvedPath = path.resolve(fullPath);
  const mediaPath = path.resolve(process.cwd(), "media");
  if (!resolvedPath.startsWith(mediaPath)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 403 });
  }

  // Check if file exists
  if (!existsSync(resolvedPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const file = await readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = getContentType(ext);

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving media file:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}

function getContentType(ext: string): string {
  const contentTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };
  return contentTypes[ext] || "application/octet-stream";
}
