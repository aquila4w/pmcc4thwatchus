import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuthenticatedUser, mockGetPayload, mockPayloadAuth } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockEventAdmin,
  mockGuest,
  mockChurch,
  mockBaptizedRegistration,
  mockMember,
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

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true, remaining: 99, resetIn: 60000 })),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@payload-config", () => ({
  default: {},
}));

vi.mock("@/lib/email", () => ({
  sendRegistrationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

import { POST, GET } from "@/app/api/guests/[guestId]/promote/route";
import { sendRegistrationEmail } from "@/lib/email";

describe("POST /api/guests/[guestId]/promote", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  function setupPromoteStore(overrides: Record<string, unknown[]> = {}) {
    const mock = createMockPayload({
      stores: {
        users: [mockGuest],
        churches: [mockChurch],
        "event-registrations": [mockBaptizedRegistration],
        ...overrides,
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    // Mock payload.auth to return the super admin user
    mockPayloadAuth(payload, mockSuperAdmin);

    return mock;
  }

  function buildPromoteRequest(guestId: string, body: Record<string, unknown>) {
    return buildRequest({
      method: "POST",
      url: `http://localhost:3000/api/guests/${guestId}/promote`,
      body,
      cookies: { "payload-token": "mock-token" },
    });
  }

  // 1. Promotes baptized guest to member with correct data
  it("promotes baptized guest to member with correct data", async () => {
    setupPromoteStore();

    const request = buildPromoteRequest("guest-1", { churchId: "church-1" });
    const response = await POST(request, { params: Promise.resolve({ guestId: "guest-1" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe("Guest promoted to member successfully");
    expect(json.user.id).toBe("guest-1");
    expect(json.user.role).toBe("member");
    expect(json.user.church).toBe("church-1");
    expect(json.user.promotedFromGuestAt).toBeDefined();

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        id: "guest-1",
        data: expect.objectContaining({
          role: "member",
          church: "church-1",
          inviteCode: expect.any(String),
          promotedFromGuestAt: expect.any(String),
        }),
      })
    );
  });

  // 2. Sends welcome email to guest
  it("sends welcome email to guest", async () => {
    setupPromoteStore();

    const request = buildPromoteRequest("guest-1", { churchId: "church-1" });
    await POST(request, { params: Promise.resolve({ guestId: "guest-1" }) });

    expect(sendRegistrationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: mockGuest.email,
        guestName: mockGuest.name,
      })
    );
  });

  // 3. Returns user name, email, inviteCode (PII preservation)
  it("returns user name, email, inviteCode in response", async () => {
    setupPromoteStore();

    const request = buildPromoteRequest("guest-1", { churchId: "church-1" });
    const response = await POST(request, { params: Promise.resolve({ guestId: "guest-1" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user.name).toBe(mockGuest.name);
    expect(json.user.email).toBe(mockGuest.email);
    expect(json.user.inviteCode).toBeDefined();
    expect(json.user.inviteCode).not.toBe("");
  });

  // 4. Returns 401 unauthenticated
  it("returns 401 when not authenticated", async () => {
    setupPromoteStore();
    // Override: no auth token on the request and no payload user
    mockPayloadAuth(payload, null);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/guests/guest-1/promote",
      body: { churchId: "church-1" },
      // No payload-token cookie
    });

    const response = await POST(request, { params: Promise.resolve({ guestId: "guest-1" }) });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Authentication required");
  });

  // 5. Returns 403 for non-admin (including eventAdmin!)
  it("returns 403 for non-admin roles including eventAdmin", async () => {
    setupPromoteStore();
    // eventAdmin is in the auth-helpers ADMIN_ROLES but NOT in this route's ADMIN_ROLES
    mockPayloadAuth(payload, mockEventAdmin);

    const request = buildPromoteRequest("guest-1", { churchId: "church-1" });
    const response = await POST(request, { params: Promise.resolve({ guestId: "guest-1" }) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Insufficient permissions");
  });

  // 6. Returns 404 guest not found
  it("returns 404 when guest not found", async () => {
    setupPromoteStore();

    // Override findByID to return null for nonexistent guest
    payload.findByID = vi.fn(async ({ collection, id }: { collection: string; id: string }) => {
      if (collection === "users" && id === "nonexistent-guest") return null;
      const docs = [
        mockGuest,
        mockChurch,
        { ...mockChurch, subDistrict: "subdistrict-1" },
      ];
      const doc = docs.find((d) => String(d.id) === String(id));
      if (!doc) return null;
      return JSON.parse(JSON.stringify(doc));
    });

    const request = buildPromoteRequest("nonexistent-guest", { churchId: "church-1" });
    const response = await POST(request, { params: Promise.resolve({ guestId: "nonexistent-guest" }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Guest not found");
  });

  // 7. Returns 400 when not guest role
  it("returns 400 when user is not a guest role", async () => {
    setupPromoteStore({
      users: [mockMember], // member, not guest
      "event-registrations": [mockBaptizedRegistration],
    });

    const request = buildPromoteRequest("member-1", { churchId: "church-1" });
    const response = await POST(request, { params: Promise.resolve({ guestId: "member-1" }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("User is not a guest");
  });

  // 8. Returns 400 when churchId missing
  it("returns 400 when churchId is missing", async () => {
    setupPromoteStore();

    const request = buildPromoteRequest("guest-1", {});
    const response = await POST(request, { params: Promise.resolve({ guestId: "guest-1" }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Church assignment is required for promotion");
  });

  // 9. Returns 400 when guest not baptized
  it("returns 400 when guest has not been baptized", async () => {
    setupPromoteStore({
      users: [mockGuest],
      churches: [mockChurch],
      "event-registrations": [], // No baptized registrations
    });

    const request = buildPromoteRequest("guest-1", { churchId: "church-1" });
    const response = await POST(request, { params: Promise.resolve({ guestId: "guest-1" }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Guest must be baptized before being promoted to member");
  });

  // 10. Returns 404 when church not found
  it("returns 404 when church not found", async () => {
    setupPromoteStore({
      users: [mockGuest],
      churches: [], // No churches
      "event-registrations": [mockBaptizedRegistration],
    });

    // Override findByID to return null for nonexistent church
    const originalFindByID = payload.findByID;
    payload.findByID = vi.fn(async ({ collection, id }: { collection: string; id: string }) => {
      if (collection === "churches") return null;
      return originalFindByID({ collection, id } as unknown as Parameters<typeof originalFindByID>[0]);
    });

    const request = buildPromoteRequest("guest-1", { churchId: "nonexistent-church" });
    const response = await POST(request, { params: Promise.resolve({ guestId: "guest-1" }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Church not found");
  });
});

describe("GET /api/guests/[guestId]/promote", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        users: [
          {
            ...mockGuest,
            church: { id: "church-1", name: "PMCC LA Church" },
            subDistrict: { id: "subdistrict-1", name: "California Sub-District" },
          },
        ],
        "event-registrations": [mockBaptizedRegistration],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  // 11. Returns eligible baptized guests with name/email/phone (PII)
  it("returns eligible baptized guests with PII (name, email, phone)", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/guests/eligible/promote",
    });

    const response = await GET(request, { params: Promise.resolve({ guestId: "eligible" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.guests).toBeDefined();
    expect(json.guests.length).toBeGreaterThan(0);

    const guest = json.guests[0];
    expect(guest.name).toBe(mockGuest.name);
    expect(guest.email).toBe(mockGuest.email);
    expect(guest.phone).toBe(mockGuest.phone);
    expect(guest.baptizedAt).toBeDefined();
  });

  // 12. Returns 401/403 for unauthorized
  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/guests/eligible/promote",
    });

    const response = await GET(request, { params: Promise.resolve({ guestId: "eligible" }) });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Authentication required");
  });

  it("returns 403 when user is not admin", async () => {
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/guests/eligible/promote",
    });

    const response = await GET(request, { params: Promise.resolve({ guestId: "eligible" }) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Insufficient permissions");
  });
});
