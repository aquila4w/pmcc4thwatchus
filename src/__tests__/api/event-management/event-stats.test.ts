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

vi.mock("@payload-config", () => ({
  default: {},
}));

import { GET } from "@/app/api/events/[eventId]/stats/route";

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
        "event-registrations": [
          { id: "r1", event: "event-3", status: "registered" },
          { id: "r2", event: "event-3", status: "registered" },
          { id: "r3", event: "event-3", status: "waitlisted" },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

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

    // Verify payload.find was called with appropriate where clauses
    const findCalls = payload.find.mock.calls;

    // First call: total registrations
    expect(findCalls[0][0].collection).toBe("event-registrations");
    expect(findCalls[0][0].where).toEqual({ event: { equals: "event-1" } });

    // Second call: attended (includes baptized)
    expect(findCalls[1][0].where.and).toEqual([
      { event: { equals: "event-1" } },
      { status: { in: ["attended", "baptized"] } },
    ]);

    // Third call: baptized only
    expect(findCalls[2][0].where.and).toEqual([
      { event: { equals: "event-1" } },
      { status: { equals: "baptized" } },
    ]);

    // Fourth call: waitlisted
    expect(findCalls[3][0].where.and).toEqual([
      { event: { equals: "event-1" } },
      { status: { equals: "waitlisted" } },
    ]);
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
