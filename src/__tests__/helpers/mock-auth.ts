import { vi } from "vitest";
import { buildRequest } from "./mock-request";

// Cached mock references so helper functions can configure them after hoisting
// Exported so test files can reference them in vi.mock factories (required when linters
// inline setupModuleMocks() and create fresh vi.fn() instances that break mockGetPayload)
export const _getPayloadMock = vi.fn();
export const _getCurrentUserMock = vi.fn();
export const _getServerSessionMock = vi.fn();
export const _headersMock = vi.fn(async () => new Headers());
export const _rateLimitMock = vi.fn(() => ({ allowed: true, remaining: 99, resetIn: 60000 }));
export const _rateLimitAsyncMock = vi.fn(async () => ({ allowed: true, remaining: 99, resetIn: 60000 }));

/**
 * Standard module-level mocks needed for most API route tests.
 * Call this at the top of the test file (it will be hoisted by Vitest).
 */
export function setupModuleMocks() {
  vi.mock("payload", () => ({
    getPayload: _getPayloadMock,
  }));

  vi.mock("@payload-config", () => ({
    default: {},
  }));

  vi.mock("next/headers", () => ({
    headers: _headersMock,
  }));

  vi.mock("next-auth", () => ({
    getServerSession: _getServerSessionMock,
  }));

  vi.mock("@/lib/auth", () => ({
    authOptions: {},
  }));

  vi.mock("@/lib/auth-helpers", async () => {
    const actual = await vi.importActual("@/lib/auth-helpers");
    return {
      ...actual,
      getCurrentUser: _getCurrentUserMock,
    };
  });

  vi.mock("@/lib/rate-limit", () => ({
    rateLimit: _rateLimitMock,
    rateLimitAsync: _rateLimitAsyncMock,
    getClientIp: vi.fn(() => "127.0.0.1"),
  }));

  vi.mock("@/lib/cache", () => ({
    wrap: vi.fn(async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn()),
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
    del: vi.fn(async () => {}),
    delPattern: vi.fn(async () => {}),
    cacheKeys: {
      event: (id: string) => `event:${id}`,
      eventStats: (id: string) => `event:${id}:stats`,
      eventCapacity: (id: string) => `event:${id}:capacity`,
      invite: (code: string) => `invite:${code}`,
      churchInvite: (code: string) => `church-invite:${code}`,
      platformLink: (code: string) => `platform-link:${code}`,
    },
    invalidateEventCache: vi.fn(async () => {}),
  }));
}

/**
 * Configure the getCurrentUser mock to return a specific user (authenticated).
 * Requires that setupModuleMocks() has been called at the top of the test file.
 */
export function mockAuthenticatedUser(user: Record<string, unknown> | null) {
  _getCurrentUserMock.mockResolvedValue(user);
}

/**
 * Create a request with an admin user authenticated via Payload token.
 */
export function createAdminRequest(
  user: Record<string, unknown>,
  options: {
    method?: string;
    url?: string;
    body?: unknown;
  } = {}
) {
  const request = buildRequest({
    method: options.method || "GET",
    url: options.url || "http://localhost:3000/api/test",
    body: options.body,
    cookies: { "payload-token": "mock-token" },
  });
  return request;
}

/**
 * Configure getPayload mock to return the provided payload mock.
 * Requires that setupModuleMocks() has been called at the top of the test file.
 */
export function mockGetPayload(payload: Record<string, unknown>) {
  _getPayloadMock.mockResolvedValue(payload);
}

/**
 * Configure payload.auth to return a specific user.
 */
export function mockPayloadAuth(payload: Record<string, unknown>, user: Record<string, unknown> | null) {
  payload.auth.mockResolvedValue({ user });
}

/**
 * Get the cached rateLimit mock for direct configuration.
 * Requires that setupModuleMocks() has been called at the top of the test file.
 */
export function getRateLimitMock() {
  return _rateLimitMock;
}

/**
 * Make getPayload reject with an error on the next call (for testing 500 errors).
 * Requires that setupModuleMocks() has been called at the top of the test file.
 */
export function mockGetPayloadError(message: string) {
  _getPayloadMock.mockRejectedValueOnce(new Error(message));
}
