import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockGetPayload } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest } from "../../helpers/mock-request";
import {
  mockEvent,
  mockChurch,
  mockChurchEventInvite,
} from "../../helpers/fixtures";

// Setup module mocks at top level
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

import { GET } from "@/app/api/church-invite/[code]/route";

describe("GET /api/church-invite/[code]", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  function setupInviteStore(overrides: Record<string, unknown[]> = {}) {
    const churchInvite = {
      id: "church-invite-1",
      code: "CHURCH01",
      event: "event-1",
      church: "church-1",
      adPlacement: "placement-1",
      status: "active",
      contactName: "Pastor Smith",
      contactEmail: "pastor@example.com",
      contactPhone: "+15551004000",
      registrationCount: 5,
    };

    const adPlacement = {
      id: "placement-1",
      name: "Bulletin Board",
      type: "bulletin",
    };

    const mock = createMockPayload({
      stores: {
        "church-event-invites": [churchInvite],
        "managed-events": [mockEvent],
        churches: [mockChurch],
        "ad-placements": [adPlacement],
        "event-registrations": [],
        media: [],
        ...overrides,
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    return mock;
  }

  // 1. Returns event details and church details
  it("returns event details and church details for valid code", async () => {
    setupInviteStore();

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/church-invite/CHURCH01",
    });

    const response = await GET(request, { params: Promise.resolve({ code: "CHURCH01" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.type).toBe("church");

    // Event details
    expect(json.event).toBeDefined();
    expect(json.event.id).toBe("event-1");
    expect(json.event.title).toBe("Summer Crusade 2026");
    expect(json.event.location).toBe("LA Convention Center");

    // Church details
    expect(json.church).toBeDefined();
    expect(json.church.id).toBe("church-1");
    expect(json.church.name).toBe("PMCC LA Church");

    // Ad placement
    expect(json.adPlacement).toBeDefined();
    expect(json.adPlacement.name).toBe("Bulletin Board");
  });

  // 2. Returns contact name, phone, email from invite (PII preservation)
  it("returns contact name, phone, email from invite record", async () => {
    setupInviteStore();

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/church-invite/CHURCH01",
    });

    const response = await GET(request, { params: Promise.resolve({ code: "CHURCH01" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.contact).toBeDefined();
    expect(json.contact.name).toBe("Pastor Smith");
    expect(json.contact.phone).toBe("+15551004000");
    expect(json.contact.email).toBe("pastor@example.com");
  });

  // 3. Returns 404 for invalid/disabled code
  it("returns 404 for invalid or disabled invite code", async () => {
    setupInviteStore();

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/church-invite/INVALID",
    });

    const response = await GET(request, { params: Promise.resolve({ code: "INVALID" }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Invalid or disabled church invite code");
  });

  it("returns 404 for disabled invite code (status != active)", async () => {
    setupInviteStore({
      "church-event-invites": [
        {
          id: "church-invite-1",
          code: "DISABLED",
          event: "event-1",
          church: "church-1",
          adPlacement: "placement-1",
          status: "disabled",
        },
      ],
    });

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/church-invite/DISABLED",
    });

    const response = await GET(request, { params: Promise.resolve({ code: "DISABLED" }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Invalid or disabled church invite code");
  });

  // 4. Returns 400 when event not open for registration
  it("returns 400 when event is not open for registration", async () => {
    const closedEvent = {
      ...mockEvent,
      status: "completed", // Not "registration-open" or "in-progress"
    };

    setupInviteStore({
      "managed-events": [closedEvent],
    });

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/church-invite/CHURCH01",
    });

    const response = await GET(request, { params: Promise.resolve({ code: "CHURCH01" }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Event is not open for registration");
  });
});
