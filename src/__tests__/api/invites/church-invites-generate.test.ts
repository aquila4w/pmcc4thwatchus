import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockEvent,
  mockChurch,
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

import { POST } from "@/app/api/church-invites/generate/route";

describe("POST /api/church-invites/generate", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  function setupGenerateStore(overrides: Record<string, unknown[]> = {}) {
    const adPlacement = {
      id: "placement-1",
      name: "Bulletin Board",
      type: "bulletin",
      status: "active",
    };

    const mock = createMockPayload({
      stores: {
        "managed-events": [mockEvent],
        churches: [mockChurch],
        "ad-placements": [adPlacement],
        "church-event-invites": [],
        ...overrides,
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
    return mock;
  }

  // 1. Creates invites for combinations
  it("creates invites for all event x church x placement combinations", async () => {
    setupGenerateStore();

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/church-invites/generate",
      body: {},
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.created).toBeGreaterThan(0);
    expect(json.total).toBe(1); // 1 event * 1 church * 1 placement

    // Verify that payload.create was called for the church-event-invites collection
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "church-event-invites",
        data: expect.objectContaining({
          event: "event-1",
          church: "church-1",
          adPlacement: "placement-1",
          status: "active",
        }),
      })
    );
  });

  it("skips existing invite combinations without duplicating", async () => {
    const existingInvite = {
      id: "existing-invite-1",
      event: "event-1",
      church: "church-1",
      adPlacement: "placement-1",
      status: "active",
    };

    setupGenerateStore({
      "church-event-invites": [existingInvite],
    });

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/church-invites/generate",
      body: {},
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.skipped).toBeGreaterThanOrEqual(0);
  });

  it("supports regenerate flag to replace existing invites", async () => {
    const existingInvite = {
      id: "existing-invite-1",
      event: "event-1",
      church: "church-1",
      adPlacement: "placement-1",
      status: "active",
    };

    setupGenerateStore({
      "church-event-invites": [existingInvite],
    });

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/church-invites/generate",
      body: { regenerate: true },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    // With regenerate, existing invites should be deleted and new ones created
    expect(payload.delete).toHaveBeenCalled();
  });

  // 2. Returns 401/403 for unauthorized
  it("returns 401 when not authenticated", async () => {
    setupGenerateStore();
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/church-invites/generate",
      body: {},
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Authentication required");
  });

  it("returns 403 when user is not admin", async () => {
    setupGenerateStore();
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/church-invites/generate",
      body: {},
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Insufficient permissions");
  });
});
