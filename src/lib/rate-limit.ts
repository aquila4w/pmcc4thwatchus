import type { NextRequest } from "next/server";

// Rate limiter with Upstash Redis for production (Netlify serverless)
// Falls back to in-memory Map for local development when Redis is not configured.

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

// --- Redis-backed rate limiter (production) ---

let redisClient: import("@upstash/redis").Redis | null = null;

async function getRedis() {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  // Dynamic import to avoid build-time errors
  const { Redis } = await import("@upstash/redis");
  redisClient = new Redis({ url, token });
  return redisClient;
}

async function redisRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const redis = await getRedis();
  if (!redis) {
    // No Redis configured — fall through to in-memory
    return memoryRateLimit(key, options);
  }

  const redisKey = `ratelimit:${key}`;
  const ttlSeconds = Math.ceil(options.windowMs / 1000);

  // Atomic INCR + set TTL on first use
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, ttlSeconds);
  }

  const ttl = await redis.ttl(redisKey);
  const resetIn = Math.max(ttl, 0) * 1000;

  if (count > options.maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return {
    allowed: true,
    remaining: Math.max(0, options.maxRequests - count),
    resetIn,
  };
}

// --- In-memory rate limiter (dev/fallback) ---

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function memoryRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Clean up expired entries periodically
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

// --- Public API (same signature as before) ---

export function rateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult | Promise<RateLimitResult> {
  const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  if (hasRedis) {
    return redisRateLimit(key, options);
  }
  return memoryRateLimit(key, options);
}

/**
 * Async rate limiter — use when Redis is configured and you need proper
 * distributed rate limiting. Falls back to sync in-memory when no Redis.
 */
export async function rateLimitAsync(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  if (hasRedis) {
    return redisRateLimit(key, options);
  }
  return memoryRateLimit(key, options);
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
