import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest } from "../../helpers/mock-request";
import {
  mockMember,
  mockEvent,
  mockEventInvite,
  mockChurchEventInvite,
  mockPlatformLink,
  mockChurch,
} from "../../helpers/fixtures";

// ---------------------------------------------------------------------------
// Module mocks — declared at top level for proper Vitest hoisting
// ---------------------------------------------------------------------------
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
  rateLimitAsync: vi.fn(async () => ({ allowed: true, remaining: 99, resetIn: 60000 })),
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

vi.mock("@/lib/analytics/get-model", () => ({
  countDocs: vi.fn(async () => 0),
  toObjectId: vi.fn((id: string) => id),
  getModel: vi.fn(),
}));

// Import the mocked countDocs so we can configure its return value in tests
import { countDocs } from "@/lib/analytics/get-model";

vi.mock("@/lib/email", () => ({
  sendRegistrationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/sms", () => ({
  sendRegistrationSMS: vi.fn().mockResolvedValue({ success: true }),
  getShortTicketUrl: vi.fn((code: string) => `http://localhost:3000/t/${code}`),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "email-123" }, error: null }),
    },
  })),
}));

// Mock global.fetch for reCAPTCHA verification
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import mocked modules so vi.mock interception is active
import { getPayload } from "payload";
import { POST } from "@/app/api/register/route";
import { sendRegistrationEmail } from "@/lib/email";
import { sendRegistrationSMS } from "@/lib/sms";
import { rateLimit, rateLimitAsync } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the default set of stores for the in-memory payload mock. */
function buildDefaultStores(overrides?: Record<string, Record<string, unknown>[]>) {
  // The church-event-invite fixture has `event` as an object, but the route
  // does `{ id: churchInvite.event }` expecting a string ID. Override to
  // a plain string for the adCode path to work correctly.
  const churchInviteForAd = {
    ...mockChurchEventInvite,
    event: "event-1",
  };

  // The event-invite fixture has `invitedBy` as a plain string ("member-1").
  // The eventInviteCode path reads `invitedBy` with depth:2, so we need the
  // member resolved. Provide the member inline.
  const eventInviteForCode = {
    ...mockEventInvite,
    invitedBy: { ...mockMember, church: { id: "church-1", name: "PMCC LA Church" } },
  };

  return {
    users: [{ ...mockMember, church: { id: "church-1", name: "PMCC LA Church" } }],
    "managed-events": [{ ...mockEvent }],
    "event-invites": [eventInviteForCode],
    "church-event-invites": [churchInviteForAd],
    "platform-event-links": [{ ...mockPlatformLink }],
    "event-registrations": [] as Record<string, unknown>[],
    churches: [{ ...mockChurch }],
    ...overrides,
  };
}

/** Default valid registration body for refCode + eventSlug path. */
function baseBody(overrides?: Record<string, unknown>) {
  return {
    firstName: "Jane",
    lastName: "Guest",
    phone: "+15551003000",
    email: "jane@example.com",
    recaptchaToken: "valid-token",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/register", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: reCAPTCHA succeeds
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });

    // Default: rate limit allows
    vi.mocked(rateLimit).mockReturnValue({ allowed: true, remaining: 99, resetIn: 60000 });
    vi.mocked(rateLimitAsync).mockResolvedValue({ allowed: true, remaining: 99, resetIn: 60000 });

    const mock = createMockPayload({ stores: buildDefaultStores() });
    payload = mock.payload;
    vi.mocked(getPayload).mockResolvedValue(payload as unknown as Awaited<ReturnType<typeof getPayload>>);
  });

  // -------------------------------------------------------------------------
  // 1. Registration via refCode + eventSlug (member invite)
  // -------------------------------------------------------------------------
  it("registers via refCode + eventSlug (member invite)", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ refCode: "MEMBR01A2", eventSlug: "summer-crusade-2026" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.registration.code).toBeDefined();
    expect(data.registration.status).toBe("registered");
  });

  // -------------------------------------------------------------------------
  // 2. Registration via eventInviteCode (legacy UUID)
  // -------------------------------------------------------------------------
  it("registers via eventInviteCode (legacy UUID)", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ eventInviteCode: "ABCD1234" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.registration.status).toBe("registered");
  });

  // -------------------------------------------------------------------------
  // 3. Registration via adCode (church ad)
  // -------------------------------------------------------------------------
  it("registers via adCode (church ad)", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ adCode: "CHURCH01" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 4. Registration via platformCode + eventSlug
  // -------------------------------------------------------------------------
  it("registers via platformCode + eventSlug", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ platformCode: "PLAT0001", eventSlug: "summer-crusade-2026" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 5. Response includes registration.code, qrCodeUrl, landingPageUrl
  // -------------------------------------------------------------------------
  it("response includes registration.code, qrCodeUrl, landingPageUrl", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ eventInviteCode: "ABCD1234" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.registration.code).toBeDefined();
    expect(typeof data.registration.code).toBe("string");
    expect(data.registration.qrCodeUrl).toContain("qrserver.com");
    expect(data.registration.landingPageUrl).toContain("/ticket/");
  });

  // -------------------------------------------------------------------------
  // 6. Response includes event title, startDate, location
  // -------------------------------------------------------------------------
  it("response includes event title, startDate, location", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ eventInviteCode: "ABCD1234" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.event.title).toBe("Summer Crusade 2026");
    expect(data.event.startDate).toBe("2026-07-15T10:00:00.000Z");
    expect(data.event.location).toBe("LA Convention Center");
  });

  // -------------------------------------------------------------------------
  // 7. Response includes invitedBy.name for member invites (PII preservation)
  // -------------------------------------------------------------------------
  it("response includes invitedBy.name for member invites", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ eventInviteCode: "ABCD1234" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invitedBy).toBeDefined();
    expect(data.invitedBy.name).toBe("John Member");
  });

  // -------------------------------------------------------------------------
  // 8. Response includes church contact info for church invites (PII)
  // -------------------------------------------------------------------------
  it("response includes church contact info for church invites", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ adCode: "CHURCH01" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invitedBy).toBeDefined();
    expect(data.invitedBy.name).toBe("Pastor Smith");
    expect(data.invitedBy.phone).toBe("+15551004000");
    expect(data.invitedBy.email).toBe("pastor@example.com");
  });

  // -------------------------------------------------------------------------
  // 9. Email is dispatched when email provided
  // -------------------------------------------------------------------------
  it("dispatches email when email provided", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ eventInviteCode: "ABCD1234" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(sendRegistrationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jane@example.com",
        guestName: "Jane Guest",
        eventTitle: "Summer Crusade 2026",
      }),
    );
  });

  // -------------------------------------------------------------------------
  // 10. SMS is dispatched when phone provided
  // -------------------------------------------------------------------------
  it("dispatches SMS when phone provided", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ eventInviteCode: "ABCD1234" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(sendRegistrationSMS).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "+15551003000",
        guestName: "Jane Guest",
        eventTitle: "Summer Crusade 2026",
      }),
    );
  });

  // -------------------------------------------------------------------------
  // 11. Guest user created with role "guest"
  // -------------------------------------------------------------------------
  it("creates guest user with role 'guest'", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ eventInviteCode: "ABCD1234" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        data: expect.objectContaining({
          role: "guest",
          name: "Jane Guest",
        }),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // 12. Registration guestInfo contains full name, email, phone (PII)
  // -------------------------------------------------------------------------
  it("registration guestInfo contains full name, email, phone", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ eventInviteCode: "ABCD1234" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "event-registrations",
        data: expect.objectContaining({
          guestInfo: {
            name: "Jane Guest",
            email: "jane@example.com",
            phone: "+15551003000",
          },
        }),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // 13. Waitlist registration when event full and joinWaitlist=true
  // -------------------------------------------------------------------------
  it("waitlist registration when event full and joinWaitlist=true", async () => {
    // Simulate capacity full — countDocs returns 500 (= maxAttendees)
    vi.mocked(countDocs).mockResolvedValue(500);

    const mock = createMockPayload({
      stores: buildDefaultStores(),
    });
    vi.mocked(getPayload).mockResolvedValue(mock.payload as unknown as Awaited<ReturnType<typeof getPayload>>);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({
        eventInviteCode: "ABCD1234",
        joinWaitlist: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.isWaitlisted).toBe(true);
    expect(data.registration.status).toBe("waitlisted");
  });

  // -------------------------------------------------------------------------
  // 14. Returns 400 when name missing
  // -------------------------------------------------------------------------
  it("returns 400 when name missing", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        phone: "+15551003000",
        recaptchaToken: "valid-token",
        eventInviteCode: "ABCD1234",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Name is required");
  });

  // -------------------------------------------------------------------------
  // 15. Returns 400 when phone missing
  // -------------------------------------------------------------------------
  it("returns 400 when phone missing", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        firstName: "Jane",
        lastName: "Guest",
        email: "jane@example.com",
        recaptchaToken: "valid-token",
        eventInviteCode: "ABCD1234",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Mobile number is required");
  });

  // -------------------------------------------------------------------------
  // 16. Returns 400 when no invite reference provided
  // -------------------------------------------------------------------------
  it("returns 400 when no invite reference provided", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody(),
      // no refCode, eventInviteCode, adCode, or platformCode
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing invite reference");
  });

  // -------------------------------------------------------------------------
  // 17. Returns 400 when recaptchaToken missing
  // -------------------------------------------------------------------------
  // NOTE: reCAPTCHA validation was removed from the registration route.
  // These tests are skipped until reCAPTCHA is re-added or the tests are rewritten.
  it.skip("returns 400 when recaptchaToken missing", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        firstName: "Jane",
        lastName: "Guest",
        phone: "+15551003000",
        eventInviteCode: "ABCD1234",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Captcha verification is required");
  });

  // -------------------------------------------------------------------------
  // 18. Returns 400 when reCAPTCHA fails
  // -------------------------------------------------------------------------
  it.skip("returns 400 when reCAPTCHA fails", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false }),
    });

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ eventInviteCode: "ABCD1234" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Captcha verification failed. Please try again.");
  });

  // -------------------------------------------------------------------------
  // 19. Returns 400 when event status not "registration-open"
  // -------------------------------------------------------------------------
  it("returns 400 when event status is not 'registration-open'", async () => {
    const closedEvent = { ...mockEvent, status: "closed" };
    const mock = createMockPayload({
      stores: buildDefaultStores({
        "managed-events": [closedEvent],
      }),
    });
    vi.mocked(getPayload).mockResolvedValue(mock.payload as unknown as Awaited<ReturnType<typeof getPayload>>);

    // Use refCode + eventSlug path so the route queries the managed-events store
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ refCode: "MEMBR01A2", eventSlug: "summer-crusade-2026" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Event registration is not open");
  });

  // -------------------------------------------------------------------------
  // 20. Returns 400 when event at capacity without joinWaitlist
  // -------------------------------------------------------------------------
  it("returns 400 when event at capacity without joinWaitlist", async () => {
    // Simulate capacity full — countDocs returns 500 (= maxAttendees)
    vi.mocked(countDocs).mockResolvedValue(500);

    const mock = createMockPayload({
      stores: buildDefaultStores(),
    });
    vi.mocked(getPayload).mockResolvedValue(mock.payload as unknown as Awaited<ReturnType<typeof getPayload>>);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({
        eventInviteCode: "ABCD1234",
        // joinWaitlist is falsy by default
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Event has reached maximum capacity");
    expect(data.capacityReached).toBe(true);
    expect(data.canJoinWaitlist).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 21. Returns 404 when member refCode invalid
  // -------------------------------------------------------------------------
  it("returns 404 when member refCode invalid", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ refCode: "INVALID_CODE", eventSlug: "summer-crusade-2026" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Invalid invite link");
  });

  // -------------------------------------------------------------------------
  // 22. Returns 404 when event slug not found
  // -------------------------------------------------------------------------
  it("returns 404 when event slug not found", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ refCode: "MEMBR01A2", eventSlug: "nonexistent-event" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Event not found");
  });

  // -------------------------------------------------------------------------
  // 23. Returns 404 when eventInviteCode invalid/inactive
  // -------------------------------------------------------------------------
  it("returns 404 when eventInviteCode invalid/inactive", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ eventInviteCode: "NONEXISTENT" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Invalid or expired invite link");
  });

  // -------------------------------------------------------------------------
  // 24. Returns 404 when adCode invalid/disabled
  // -------------------------------------------------------------------------
  it("returns 404 when adCode invalid/disabled", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ adCode: "INVALID_AD" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Invalid or disabled church invite code");
  });

  // -------------------------------------------------------------------------
  // 25. Returns 404 when platformCode invalid/disabled
  // -------------------------------------------------------------------------
  it("returns 404 when platformCode invalid/disabled", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ platformCode: "INVALID_PLAT", eventSlug: "summer-crusade-2026" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Invalid or disabled platform link");
  });

  // -------------------------------------------------------------------------
  // 26. Returns 429 when rate limit exceeded
  // -------------------------------------------------------------------------
  it("returns 429 when rate limit exceeded", async () => {
    vi.mocked(rateLimitAsync).mockResolvedValue({ allowed: false, remaining: 0, resetIn: 60000 });

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ eventInviteCode: "ABCD1234" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain("Too many registrations");
  });

  // -------------------------------------------------------------------------
  // 27. Returns 500 on unexpected error
  // -------------------------------------------------------------------------
  it("returns 500 on unexpected error", async () => {
    // Force payload.find to throw
    payload.find.mockRejectedValueOnce(new Error("Database connection lost"));

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: baseBody({ eventInviteCode: "ABCD1234" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
