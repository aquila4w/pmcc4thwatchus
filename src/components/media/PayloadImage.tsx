"use client";

import Image from "next/image";
import { useState } from "react";

interface PayloadImageProps {
  src: string | { url: string; alt?: string; width?: number; height?: number };
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
}

/**
 * Payload Image Component
 *
 * Handles images from Payload CMS which may be served from:
 * - Local: /payload-api/media/file/...
 * - S3: https://...
 *
 * This component converts Payload URLs to absolute URLs for Next.js Image optimization.
 */
export function PayloadImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 75,
}: PayloadImageProps) {
  const [error, setError] = useState(false);

  // Extract URL if src is an object
  let imageUrl = typeof src === "string" ? src : src.url;
  let imageAlt = alt || (typeof src === "object" ? src.alt : "");

  // Convert relative Payload URLs to absolute URLs
  // Next.js Image needs absolute URLs or properly configured rewrites
  if (imageUrl.startsWith("/payload-api/")) {
    // In development, use localhost
    // In production, the API route should be accessible
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
    imageUrl = `${baseUrl}${imageUrl}`;
  }

  // If image failed to load, show fallback
  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-200 dark:bg-slate-800 ${className}`}
        style={fill ? { position: "absolute", inset: 0 } : { width, height }}
      >
        <span className="text-slate-400 text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={imageAlt || "Image"}
      width={fill ? undefined : width || 800}
      height={fill ? undefined : height || 600}
      className={className}
      priority={priority}
      fill={fill}
      sizes={sizes}
      quality={quality}
      onError={() => setError(true)}
      unoptimized={imageUrl.startsWith("/payload-api/")} // Skip optimization for local API routes
    />
  );
}
