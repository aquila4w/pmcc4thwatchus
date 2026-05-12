import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { mockGetPayload, mockPayloadAuth } from "../../helpers/mock-auth";
import { buildRequest } from "../../helpers/mock-request";
import { mockSuperAdmin, mockMember, mockDistrictCoordinator, mockSubDistrictCoordinator } from "../../helpers/fixtures";

// Setup module-level mocks
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

// Mock crypto module for generateShortCode
vi.mock("crypto", () => ({
  randomInt: vi.fn(() => 0), // Always picks first char 'A'
}));

// Import handlers AFTER mocks are set up
import { POST } from "@/app/api/admin/migrate-invite-codes/route";

describe("POST /api/admin/migrate-invite-codes", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "event-invites": [],
        users: [mockSuperAdmin],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
  });

  function createAuthenticatedRequest(user: Record<string, unknown>) {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/migrate-invite-codes",
      cookies: { "payload-token": "mock-token" },
    });
    mockPayloadAuth(payload, user);
    return request;
  }

  it("returns 403 when not authenticated (no token, no session)", async () => {
    // No payload-token cookie, and getServerSession returns null by default
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/migrate-invite-codes",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 403 for non-superAdmin/non-districtCoordinator roles", async () => {
    // Test with subDistrictCoordinator (an admin role but not allowed here)
    const request = createAuthenticatedRequest(mockSubDistrictCoordinator);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 403 for regular member", async () => {
    const request = createAuthenticatedRequest(mockMember);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("migrates UUID-format invite codes to short codes for superAdmin", async () => {
    const mock = createMockPayload({
      stores: {
        "event-invites": [
          {
            id: "invite-uuid-1",
            inviteCode: "550e8400-e29b-41d4-a716-446655440000", // UUID format with dashes
            event: "event-1",
            status: "active",
          },
          {
            id: "invite-uuid-2",
            inviteCode: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", // UUID format with dashes
            event: "event-2",
            status: "active",
          },
        ],
        users: [mockSuperAdmin],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = createAuthenticatedRequest(mockSuperAdmin);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.migrated).toBe(2);
    expect(data.message).toContain("Migrated");

    // Verify update was called for each invite
    expect(payload.update).toHaveBeenCalledTimes(2);
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "event-invites",
        data: expect.objectContaining({
          inviteCode: expect.stringMatching(/^[A-Z0-9]+$/),
        }),
      })
    );
  });

  it("allows districtCoordinator to run migration", async () => {
    const mock = createMockPayload({
      stores: {
        "event-invites": [
          {
            id: "invite-uuid-dc",
            inviteCode: "aa-bb-cc", // Contains dashes = UUID format
            event: "event-1",
            status: "active",
          },
        ],
        users: [mockDistrictCoordinator],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = createAuthenticatedRequest(mockDistrictCoordinator);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.migrated).toBe(1);
  });

  it("returns 0 migrated when no UUID-format codes found", async () => {
    const mock = createMockPayload({
      stores: {
        "event-invites": [
          {
            id: "invite-short-1",
            inviteCode: "ABCD1234", // Already short format, no dashes
            event: "event-1",
            status: "active",
          },
        ],
        users: [mockSuperAdmin],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = createAuthenticatedRequest(mockSuperAdmin);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.migrated).toBe(0);
    expect(data.message).toContain("No UUID-format codes found");
  });

  it("returns 500 on internal error", async () => {
    payload.find.mockRejectedValueOnce(new Error("DB error"));

    const request = createAuthenticatedRequest(mockSuperAdmin);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Migration failed");
  });
});
