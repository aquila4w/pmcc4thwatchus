import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockRegistration,
  mockAttendedRegistration,
  mockBaptizedRegistration,
  mockEvent,
  mockChurch,
} from "../../helpers/fixtures";

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

// Import after mocks are set up
import { POST, GET } from "@/app/api/check-in/route";

describe("POST /api/check-in", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "event-registrations": [mockRegistration],
        "managed-events": [mockEvent],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  // 1. Successfully checks in a registered guest
  it("successfully checks in a registered guest", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Check-in successful");
    expect(data.registration.status).toBe("attended");
    expect(data.registration.attendedAt).toBeDefined();

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "event-registrations",
        id: mockRegistration.id,
        data: expect.objectContaining({ status: "attended" }),
      })
    );
  });

  // 2. Returns guestName in response (PII preservation)
  it("returns guestName in response", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.registration.guestName).toBe("Jane Guest");
  });

  // 3. Returns invitedBy.name and invitedBy.church in response
  it("returns invitedBy.name and invitedBy.church in response", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.registration.invitedBy).toBeDefined();
    expect(data.registration.invitedBy.name).toBe("John Member");
    expect(data.registration.invitedBy.church).toBe("PMCC LA Church");
  });

  // 4. Returns event.hasBaptism flag
  it("returns event.hasBaptism flag", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.event).toBeDefined();
    expect(data.event.hasBaptism).toBe(true);
  });

  // 5. Returns 401 when not authenticated
  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Authentication required");
  });

  // 6. Returns 403 when user is not admin
  it("returns 403 when user is not admin", async () => {
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Insufficient permissions");
  });

  // 7. Returns 400 when registrationCode missing
  it("returns 400 when registrationCode is missing", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: {},
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing registration code");
  });

  // 8. Returns 404 when registration not found
  it("returns 404 when registration not found", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: { registrationCode: "NONEXISTENT" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.code).toBe("NOT_FOUND");
  });

  // 9. Returns ALREADY_CHECKED_IN when already attended
  it("returns ALREADY_CHECKED_IN when guest already attended", async () => {
    const mock = createMockPayload({
      stores: {
        "event-registrations": [mockAttendedRegistration],
        "managed-events": [mockEvent],
      },
    });
    mockGetPayload(mock.payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: { registrationCode: "ATNDCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.code).toBe("ALREADY_CHECKED_IN");
    expect(data.registration.guestName).toBe("Jane Guest");
    expect(data.registration.status).toBe("attended");
    expect(data.registration.attendedAt).toBe("2026-07-15T09:30:00.000Z");
  });

  // 10. Returns 400 when event has check-in disabled
  it("returns 400 when event has check-in disabled", async () => {
    const disabledEvent = {
      ...mockEvent,
      checkInEnabled: false,
    };
    const regWithDisabledCheckin = {
      ...mockRegistration,
      event: {
        id: "event-1",
        title: "Summer Crusade 2026",
        hasBaptism: true,
        checkInEnabled: false,
      },
    };
    const mock = createMockPayload({
      stores: {
        "event-registrations": [regWithDisabledCheckin],
        "managed-events": [disabledEvent],
      },
    });
    mockGetPayload(mock.payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe("CHECK_IN_DISABLED");
  });
});

describe("GET /api/check-in", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "event-registrations": [mockRegistration],
        "managed-events": [mockEvent],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  // 11. Returns registration details including guestName, guestEmail, guestPhone
  it("returns registration details including PII (guestName, guestEmail, guestPhone)", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/check-in?code=REGCODE1",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.registration.guestName).toBe("Jane Guest");
    expect(data.registration.guestEmail).toBe("jane@example.com");
    expect(data.registration.guestPhone).toBe("+15551003000");
  });

  // 12. Returns event info
  it("returns event info", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/check-in?code=REGCODE1",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.event).toBeDefined();
    expect(data.event.id).toBe("event-1");
    expect(data.event.title).toBe("Summer Crusade 2026");
    expect(data.event.hasBaptism).toBe(true);
  });

  // 13. Returns invitedBy info with name, phone, email, church
  it("returns invitedBy info with name, phone, email, church", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/check-in?code=REGCODE1",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invitedBy).toBeDefined();
    expect(data.invitedBy.name).toBe("John Member");
    expect(data.invitedBy.phone).toBe("+15551002000");
    expect(data.invitedBy.email).toBe("john@example.com");
    expect(data.invitedBy.church).toBe("PMCC LA Church");
  });

  // 14. Returns 400 when code parameter missing
  it("returns 400 when code parameter is missing", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/check-in",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing code parameter");
  });

  // 15. Returns 404 when registration not found
  it("returns 404 when registration not found", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/check-in?code=NONEXISTENT",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Registration not found");
  });

  // 16. Returns 401 when not authenticated
  it("does not require authentication (public lookup)", async () => {
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/check-in?code=REGCODE1",
    });

    const response = await GET(request);

    // GET is public - no auth required, returns registration data
    expect(response.status).toBe(200);
  });
});
