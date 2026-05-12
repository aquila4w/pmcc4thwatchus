import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

describe("rateLimit", () => {
  const defaultOptions = { windowMs: 60_000, maxRequests: 5 };

  it("returns allowed:true with remaining decremented on first request", () => {
    const result = rateLimit("test-key", defaultOptions);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4); // maxRequests - 1
    expect(result.resetIn).toBeGreaterThan(0);
  });

  it("returns allowed:false when maxRequests is reached", () => {
    // Make 5 requests (maxRequests)
    for (let i = 0; i < 5; i++) {
      rateLimit("limit-key", defaultOptions);
    }

    // The 6th request should be blocked
    const result = rateLimit("limit-key", defaultOptions);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different keys independently", () => {
    const resultA = rateLimit("key-a", defaultOptions);
    const resultB = rateLimit("key-b", defaultOptions);

    expect(resultA.allowed).toBe(true);
    expect(resultA.remaining).toBe(4);
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBe(4);

    // Exhaust key-a
    for (let i = 1; i < 5; i++) {
      rateLimit("key-a", defaultOptions);
    }

    // key-a is now blocked
    const blockedResult = rateLimit("key-a", defaultOptions);
    expect(blockedResult.allowed).toBe(false);

    // key-b still works
    const stillAllowed = rateLimit("key-b", defaultOptions);
    expect(stillAllowed.allowed).toBe(true);
    expect(stillAllowed.remaining).toBe(3);
  });
});

describe("getClientIp", () => {
  it("reads IP from x-forwarded-for header (first IP in comma-separated list)", () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        "x-forwarded-for": "203.0.113.50, 70.41.3.18, 150.172.238.178",
      },
    });

    const ip = getClientIp(request);
    expect(ip).toBe("203.0.113.50");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        "x-real-ip": "10.0.0.1",
      },
    });

    const ip = getClientIp(request);
    expect(ip).toBe("10.0.0.1");
  });

  it('returns "unknown" when neither header is present', () => {
    const request = new NextRequest("http://localhost:3000/api/test");

    const ip = getClientIp(request);
    expect(ip).toBe("unknown");
  });
});
