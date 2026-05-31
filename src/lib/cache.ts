import type { Redis } from "@upstash/redis";

// General-purpose cache backed by Upstash Redis.
// Falls back to a no-op passthrough when Redis is not configured (dev mode),
// so all codepaths remain correct without a Redis instance.

let redisInstance: Redis | null = null;

async function getRedis(): Promise<Redis | null> {
  if (redisInstance) return redisInstance;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = await import("@upstash/redis");
  redisInstance = new Redis({ url, token });
  return redisInstance;
}

/** Check once (sync) whether Redis is configured. */
function hasRedis(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// --- Public API ---

/**
 * Get a cached value. Returns `null` if the key doesn't exist or Redis is unavailable.
 */
export async function get<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(key);
    if (raw === null) return null;
    // Upstash returns the value as-is for JSON types; parse if it's a string
    if (typeof raw === "string") {
      try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
    }
    return raw as unknown as T;
  } catch (err) {
    console.error("Cache get error:", err);
    return null;
  }
}

/**
 * Set a cached value with a TTL in seconds.
 */
export async function set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch (err) {
    console.error("Cache set error:", err);
  }
}

/**
 * Delete a single cache key.
 */
export async function del(key: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error("Cache del error:", err);
  }
}

/**
 * Delete all keys matching a prefix pattern.
 * Upstash supports KEYS on small datasets; for production scale we iterate
 * with SCAN-like semantics via the REST API's `keys` command.
 */
export async function delPattern(prefix: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try {
    // Use the Upstash REST API's keys command to find matching keys
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error("Cache delPattern error:", err);
  }
}

/**
 * Get-or-compute: returns the cached value if present, otherwise calls `fn()`,
 * caches the result with the given TTL, and returns it.
 * When Redis is unavailable, simply calls `fn()` every time (passthrough).
 */
export async function wrap<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  // Fast path: if no Redis configured, just call the function
  if (!hasRedis()) {
    return fn();
  }

  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await fn();

  // Fire-and-forget the cache write — don't block the response
  set(key, result, ttlSeconds).catch(() => {});

  return result;
}

/**
 * Build cache keys for common patterns. Centralised here so all consumers
 * use the same key format.
 */
export const cacheKeys = {
  event: (eventId: string) => `event:${eventId}`,
  eventStats: (eventId: string) => `event:${eventId}:stats`,
  eventCapacity: (eventId: string) => `event:${eventId}:capacity`,
  invite: (code: string) => `invite:${code}`,
  churchInvite: (code: string) => `church-invite:${code}`,
  platformLink: (code: string) => `platform-link:${code}`,
} as const;

/**
 * Invalidate all cached data for an event after a write operation.
 */
export async function invalidateEventCache(eventId: string): Promise<void> {
  await Promise.all([
    del(cacheKeys.eventStats(eventId)),
    del(cacheKeys.eventCapacity(eventId)),
  ]);
}
