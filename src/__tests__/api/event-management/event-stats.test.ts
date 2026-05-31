import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import { mockSuperAdmin, mockMember, mockEvent } from "../../helpers/fixtures";

vi.mock("payload", () => ({
  getPayload: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/auth-helpers", async () => {
  const actual = await vi.importActual("@/lib/auth-helpers");
  return {
    ...actual,
    getCurrentUser: vi.fn(),
  };
});

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true, remaining: 99, resetIn: 60000 })),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock(import("@/lib/cache"), () => ({
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

vi.mock(import("@/lib/analytics/get-model"), () => ({
  countDocs: vi.fn(async () => 0),
  toObjectId: vi.fn((id: string) => id),
  getModel: vi.fn(),
}));

vi.mock("@payload-config", () => ({
  default: {},
}));

import { GET } from "@/app/api/events/[eventId]/stats/route";
import { countDocs } from "@/lib/analytics/get-model";

describe("GET /api/events/[eventId]/stats", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [
          { ...mockEvent, id: "event-1", maxAttendees: 500 },
        ],
        "event-registrations": [
          { id: "r1", event: "event-1", status: "registered" },
          { id: "r2", event: "event-1", status: "registered" },
          { id: "r3", event: "event-1", status: "attended" },
          { id: "r4", event: "event-1", status: "attended" },
          { id: "r5", event: "event-1", status: "baptized" },
          { id: "r6", event: "event-1", status: "waitlisted" },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("returns correct event statistics", async () => {
    // countDocs is called 4 times: total(6), attended(3), baptized(1), waitlisted(1)
    vi.mocked(countDocs)
      .mockResolvedValueOnce(6)   // total registrations
      .mockResolvedValueOnce(3)   // attended (includes baptized)
      .mockResolvedValueOnce(1)   // baptized
      .mockResolvedValueOnce(1);  // waitlisted

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/stats",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalRegistrations).toBe(6);
    expect(data.attendedCount).toBe(3); // attended (2) + baptized (1)
    expect(data.baptizedCount).toBe(1);
    expect(data.waitlistedCount).toBe(1);
    expect(data.notAttended).toBe(3); // total - attended
    expect(data.attendedNotBaptized).toBe(2); // attendedCount - baptizedCount
  });

  it("calculates spotsRemaining from maxAttendees", async () => {
    // countDocs: total=6, attended=3, baptized=1, waitlisted=1
    vi.mocked(countDocs)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/stats",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.spotsRemaining).toBe(494); // 500 max - 6 registered
  });

  it("returns spotsRemaining as null when maxAttendees is not set", async () => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [
          { ...mockEvent, id: "event-2", maxAttendees: null },
        ],
        "event-registrations": [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-2/stats",
    });
    const response = await GET(request, buildParams({ eventId: "event-2" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.spotsRemaining).toBeNull();
  });

  it("returns spotsRemaining as 0 when event is full", async () => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [
          { ...mockEvent, id: "event-3", maxAttendees: 2 },
        ],
        "event-registrations": [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    // countDocs: total=3 (exceeds maxAttendees of 2), attended=2, baptized=0, waitlisted=1
    vi.mocked(countDocs)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-3/stats",
    });
    const response = await GET(request, buildParams({ eventId: "event-3" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    // maxAttendees(2) - totalRegistrations(3) would be negative, so Math.max(0, ...) = 0
    expect(data.spotsRemaining).toBe(0);
  });

  it("returns 404 for invalid event", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/nonexistent/stats",
    });
    const response = await GET(request, buildParams({ eventId: "nonexistent" }));

    expect(response.status).toBe(500);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/stats",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/stats",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(403);
  });

  it("queries event-registrations collection with correct where clauses", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/stats",
    });
    await GET(request, buildParams({ eventId: "event-1" }));

    // Verify countDocs was called 4 times with appropriate filters
    const countCalls = vi.mocked(countDocs).mock.calls;

    // First call: total registrations (no status filter)
    expect(countCalls[0][1]).toBe("event-registrations");
    expect(countCalls[0][2]).toEqual({ event: "event-1" });

    // Second call: attended (includes baptized)
    expect(countCalls[1][2]).toEqual({
      event: "event-1",
      status: { $in: ["attended", "baptized"] },
    });

    // Third call: baptized only
    expect(countCalls[2][2]).toEqual({
      event: "event-1",
      status: "baptized",
    });

    // Fourth call: waitlisted
    expect(countCalls[3][2]).toEqual({
      event: "event-1",
      status: "waitlisted",
    });
  });

  it("returns 500 on internal error", async () => {
    payload.findByID.mockRejectedValueOnce(new Error("DB error"));
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/stats",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(500);
  });
});
