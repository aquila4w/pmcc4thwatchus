import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockEvent,
} from "../../helpers/fixtures";

// Setup module mocks at top level (hoisted by Vitest)
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

vi.mock("@payload-config", () => ({
  default: {},
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true, remaining: 99, resetIn: 60000 })),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "email-promo-123" }, error: null }),
    },
  })),
}));

// Set RESEND_API_KEY so emails are attempted
process.env.RESEND_API_KEY = "re_test_key";

import { POST, GET } from "@/app/api/waitlist/promote/route";

// Flat registration with string event ID for where-clause matching
const waitlistedReg = {
  id: "reg-4",
  inviteCode: "WAITCODE1",
  event: "event-1",
  status: "waitlisted",
  waitlistPosition: 1,
  guestName: "Jane Guest",
  guestEmail: "jane@example.com",
  guestInfo: {
    name: "Jane Guest",
    email: "jane@example.com",
    phone: "+15551003000",
  },
  ticketCode: "WAITCODE1",
};

describe("POST /api/waitlist/promote", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  function setupWaitlistStore(overrides: Record<string, unknown[]> = {}) {
    const mock = createMockPayload({
      stores: {
        "managed-events": [
          {
            ...mockEvent,
            maxCapacity: 500,
          },
        ],
        "event-registrations": [waitlistedReg],
        ...overrides,
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
    return mock;
  }

  // 1. Promotes waitlisted registrations
  it("promotes waitlisted registrations from waitlist to confirmed", async () => {
    setupWaitlistStore();

    // Override count to return 0 confirmed
    payload.count = vi.fn().mockResolvedValue({ totalDocs: 0 });

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/waitlist/promote",
      body: { eventId: "event-1" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.promoted).toBeGreaterThan(0);
    expect(json.promotedRegistrations).toBeDefined();
    expect(json.promotedRegistrations[0].guestName).toBe("Jane Guest");

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "event-registrations",
        id: "reg-4",
        data: expect.objectContaining({
          status: "confirmed",
          waitlistPosition: null,
          promotedFromWaitlistAt: expect.any(String),
        }),
      })
    );
  });

  // 2. Sends promotion emails with guest name
  it("sends promotion emails to promoted guests", async () => {
    setupWaitlistStore();

    payload.count = vi.fn().mockResolvedValue({ totalDocs: 0 });

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/waitlist/promote",
      body: { eventId: "event-1" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.promotedRegistrations[0].guestEmail).toBe("jane@example.com");
  });

  // 3. Returns 400 when no available spots
  it("returns 400 when no available spots", async () => {
    setupWaitlistStore({
      "managed-events": [
        {
          ...mockEvent,
          maxCapacity: 10,
        },
      ],
    });

    // Simulate the event is full
    payload.count = vi.fn().mockResolvedValue({ totalDocs: 10 });

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/waitlist/promote",
      body: { eventId: "event-1" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("No available spots");
  });

  // 4. Returns 400 when eventId missing
  it("returns 400 when eventId is missing", async () => {
    setupWaitlistStore();

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/waitlist/promote",
      body: {},
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Event ID is required");
  });

  // 5. Returns 401/403
  it("returns 401 when not authenticated", async () => {
    setupWaitlistStore();
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/waitlist/promote",
      body: { eventId: "event-1" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Authentication required");
  });

  it("returns 403 when user is not admin", async () => {
    setupWaitlistStore();
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/waitlist/promote",
      body: { eventId: "event-1" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Insufficient permissions");
  });
});

describe("GET /api/waitlist/promote", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [
          {
            ...mockEvent,
            maxCapacity: 500,
          },
        ],
        "event-registrations": [waitlistedReg],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  // 6. Returns waitlist status
  it("returns waitlist status with counts and available spots", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/waitlist/promote?eventId=event-1",
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.eventId).toBe("event-1");
    expect(json.maxCapacity).toBe(500);
    expect(json.confirmed).toBeDefined();
    expect(json.waitlisted).toBeDefined();
    expect(json.availableSpots).toBeDefined();
    expect(json.canPromote).toBeDefined();
    expect(json.promotableCount).toBeDefined();
  });

  // 7. Returns 400 when eventId missing
  it("returns 400 when eventId is missing", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/waitlist/promote",
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Event ID is required");
  });

  // 8. Returns 401/403
  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/waitlist/promote?eventId=event-1",
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Authentication required");
  });

  it("returns 403 when user is not admin", async () => {
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/waitlist/promote?eventId=event-1",
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Insufficient permissions");
  });
});
