import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockRegistration,
  mockBaptizedRegistration,
  mockEvent,
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

vi.mock("@payload-config", () => ({
  default: {},
}));

// Import after mocks are set up
import { POST } from "@/app/api/baptism/route";

describe("POST /api/baptism", () => {
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

  // 1. Successfully marks registration as baptized
  it("successfully marks registration as baptized", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/baptism",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Baptism recorded successfully");
    expect(data.registration.status).toBe("baptized");
    expect(data.registration.baptizedAt).toBeDefined();

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "event-registrations",
        id: mockRegistration.id,
        data: expect.objectContaining({ status: "baptized" }),
      })
    );
  });

  // 2. Auto-marks as attended if status was "registered"
  it("auto-marks as attended if status was registered", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/baptism",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.registration.attendedAt).toBeDefined();
    expect(data.registration.baptizedAt).toBeDefined();

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "event-registrations",
        id: mockRegistration.id,
        data: expect.objectContaining({
          status: "baptized",
          attendedAt: expect.any(String),
          baptizedAt: expect.any(String),
        }),
      })
    );
  });

  // 3. Returns guestName in response (PII preservation)
  it("returns guestName in response", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/baptism",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.registration.guestName).toBe("Jane Guest");
  });

  // 4. Returns 401 when not authenticated
  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/baptism",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Authentication required");
  });

  // 5. Returns 403 when not admin
  it("returns 403 when user is not admin", async () => {
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/baptism",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Insufficient permissions");
  });

  // 6. Returns 400 when registrationCode missing
  it("returns 400 when registrationCode is missing", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/baptism",
      body: {},
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing registration code");
  });

  // 7. Returns 404 when registration not found
  it("returns 404 when registration not found", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/baptism",
      body: { registrationCode: "NONEXISTENT" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.code).toBe("NOT_FOUND");
  });

  // 8. Returns ALREADY_BAPTIZED when already baptized
  it("returns ALREADY_BAPTIZED when guest already baptized", async () => {
    const mock = createMockPayload({
      stores: {
        "event-registrations": [mockBaptizedRegistration],
        "managed-events": [mockEvent],
      },
    });
    mockGetPayload(mock.payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/baptism",
      body: { registrationCode: "BPTCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.code).toBe("ALREADY_BAPTIZED");
    expect(data.registration.guestName).toBe("Jane Guest");
    expect(data.registration.status).toBe("baptized");
    expect(data.registration.baptizedAt).toBe("2026-07-15T11:00:00.000Z");
  });

  // 9. Returns 400 when event has baptism disabled
  it("returns 400 when event has baptism disabled", async () => {
    const noBaptismEvent = {
      ...mockEvent,
      hasBaptism: false,
    };
    const regWithNoBaptism = {
      ...mockRegistration,
      event: {
        id: "event-1",
        title: "Summer Crusade 2026",
        hasBaptism: false,
      },
    };
    const mock = createMockPayload({
      stores: {
        "event-registrations": [regWithNoBaptism],
        "managed-events": [noBaptismEvent],
      },
    });
    mockGetPayload(mock.payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/baptism",
      body: { registrationCode: "REGCODE1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe("BAPTISM_NOT_ENABLED");
  });
});
