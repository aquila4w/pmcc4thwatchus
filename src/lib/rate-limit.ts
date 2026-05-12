import type { NextRequest } from "next/server";

// Simple in-memory rate limiter using a fixed-window counter approach.
// Suitable for single-instance deployments. In serverless/multi-instance
// environments, each instance maintains its own map, so limits are approximate.

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

export function rateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Clean up expired entries periodically (every 100 checks)
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap) {
      if (v.resetTime < now) rateLimitMap.delete(k);
    }
  }

  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetIn: options.windowMs,
    };
  }

  if (entry.count >= options.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
