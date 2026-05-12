import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest } from "../../helpers/mock-request";
import {
  mockMember,
  mockChurch,
  mockEvent,
  mockEventInvite,
  mockRegistration,
  mockAttendedRegistration,
  mockBaptizedRegistration,
} from "../../helpers/fixtures";

// Mock module-level imports at top level (hoisted by Vitest)
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

// Import mocked modules so vi.mock interception is active
import { getPayload } from "payload";
import { getServerSession } from "next-auth";
import { GET } from "@/app/api/auth/me/route";

describe("GET /api/auth/me", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    vi.clearAllMocks();

    const mock = createMockPayload({
      stores: {
        users: [mockMember],
        churches: [mockChurch],
        "event-registrations": [
          mockRegistration,
          mockAttendedRegistration,
          mockBaptizedRegistration,
        ],
        "event-invites": [
          {
            ...mockEventInvite,
            event: mockEvent.id,
            invitedBy: mockMember.id,
          },
        ],
        "managed-events": [
          {
            ...mockEvent,
            startDate: "2099-07-15T10:00:00.000Z", // future date so invite is valid
          },
        ],
      },
    });
    payload = mock.payload;
    vi.mocked(getPayload).mockResolvedValue(payload as unknown as Awaited<ReturnType<typeof getPayload>>);

    // Default: no NextAuth session
    vi.mocked(getServerSession).mockResolvedValue(null);
  });

  // ---- Success via Payload token ----

  it("returns user profile with id, email, name, phone, role, inviteCode, church", async () => {
    // Configure payload.auth to return the member user
    payload.auth.mockResolvedValue({ user: mockMember });

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/auth/me",
      cookies: { "payload-token": "valid-token" },
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user).toHaveProperty("id", mockMember.id);
    expect(json.user).toHaveProperty("email", mockMember.email);
    expect(json.user).toHaveProperty("name", mockMember.name);
    expect(json.user).toHaveProperty("phone", mockMember.phone);
    expect(json.user).toHaveProperty("role", mockMember.role);
    expect(json.user).toHaveProperty("inviteCode", mockMember.inviteCode);
    expect(json.user).toHaveProperty("church", mockChurch.name);
  });

  it("returns invite stats: totalInvites, registered, attended, baptized", async () => {
    payload.auth.mockResolvedValue({ user: mockMember });

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/auth/me",
      cookies: { "payload-token": "valid-token" },
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.stats).toHaveProperty("totalInvites");
    expect(json.stats).toHaveProperty("registered");
    expect(json.stats).toHaveProperty("attended");
    expect(json.stats).toHaveProperty("baptized");
    // All stats are numbers
    expect(typeof json.stats.totalInvites).toBe("number");
    expect(typeof json.stats.registered).toBe("number");
    expect(typeof json.stats.attended).toBe("number");
    expect(typeof json.stats.baptized).toBe("number");
  });

  // ---- Not authenticated ----

  it("returns 401 when not authenticated", async () => {
    // payload.auth returns no user
    payload.auth.mockResolvedValue({ user: null });
    // No NextAuth session
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/auth/me",
      // No payload-token cookie
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Not authenticated");
  });

  // ---- Auth via Payload token ----

  it("auth via Payload token works", async () => {
    payload.auth.mockResolvedValue({ user: mockMember });

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/auth/me",
      cookies: { "payload-token": "valid-token" },
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user.id).toBe(mockMember.id);
    expect(payload.auth).toHaveBeenCalled();
    // Should NOT have fallen back to NextAuth
    expect(getServerSession).not.toHaveBeenCalled();
  });

  // ---- Auth via NextAuth session ----

  it("auth via NextAuth session works", async () => {
    // payload.auth returns no user (no token cookie path)
    payload.auth.mockResolvedValue({ user: null });
    // But NextAuth session returns the user
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: mockMember.id } });
    payload.findByID.mockResolvedValue(mockMember);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/auth/me",
      // No payload-token cookie
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user.id).toBe(mockMember.id);
    expect(getServerSession).toHaveBeenCalled();
    // payload.findByID used to look up the user
    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        id: mockMember.id,
      })
    );
  });

  // ---- Error handling ----

  it("returns 401 on error", async () => {
    // Force an error by making getPayload reject for this one call
    vi.mocked(getPayload).mockRejectedValueOnce(new Error("DB connection failed"));

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/auth/me",
      cookies: { "payload-token": "some-token" },
    });

    const response = await GET(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Authentication failed");
  });
});
