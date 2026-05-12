import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock module-level imports before importing the module under test
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

vi.mock("@payload-config", () => ({
  default: {},
}));

// Import mocked modules at top level so vi.mock interception is active
import { getPayload } from "payload";
import { getServerSession } from "next-auth";
import { isAdmin, isElevatedRole, getCurrentUser } from "@/lib/auth-helpers";
import { buildRequest } from "../../helpers/mock-request";

// ---------------------------------------------------------------------------
// Pure function tests (no mocks needed beyond module setup)
// ---------------------------------------------------------------------------

describe("isAdmin", () => {
  it("returns true for all 6 admin roles", () => {
    const adminRoles = [
      "superAdmin",
      "districtCoordinator",
      "subDistrictCoordinator",
      "eventAdmin",
      "headMinister",
      "secretary",
    ];

    for (const role of adminRoles) {
      expect(isAdmin(role)).toBe(true);
    }
  });

  it("returns false for non-admin roles", () => {
    const nonAdminRoles = ["member", "guest", "associateMinister", "bibleStudent"];

    for (const role of nonAdminRoles) {
      expect(isAdmin(role)).toBe(false);
    }
  });

  it("returns false for undefined", () => {
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe("isElevatedRole", () => {
  it("returns true for the 4 elevated roles", () => {
    const elevatedRoles = [
      "superAdmin",
      "districtCoordinator",
      "subDistrictCoordinator",
      "eventAdmin",
    ];

    for (const role of elevatedRoles) {
      expect(isElevatedRole(role)).toBe(true);
    }
  });

  it("returns false for headMinister, secretary, and member", () => {
    expect(isElevatedRole("headMinister")).toBe(false);
    expect(isElevatedRole("secretary")).toBe(false);
    expect(isElevatedRole("member")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getCurrentUser tests (requires mocking payload and next-auth)
// ---------------------------------------------------------------------------

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user via Payload token when cookie is present", async () => {
    const mockUser = { id: "user-1", email: "test@example.com", role: "superAdmin" };
    const mockPayload = {
      auth: vi.fn().mockResolvedValue({ user: mockUser }),
    };
    vi.mocked(getPayload).mockResolvedValue(mockPayload as any);

    const request = buildRequest({
      cookies: { "payload-token": "valid-token" },
    });

    const user = await getCurrentUser(request);
    expect(user).toEqual(mockUser);
    expect(mockPayload.auth).toHaveBeenCalled();
  });

  it("falls back to NextAuth when no Payload token is present", async () => {
    const mockUser = { id: "user-2", email: "nextauth@example.com", role: "member" };
    const mockPayload = {
      findByID: vi.fn().mockResolvedValue(mockUser),
    };
    vi.mocked(getPayload).mockResolvedValue(mockPayload as any);
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user-2" } } as any);

    // No payload-token cookie
    const request = buildRequest({});

    const user = await getCurrentUser(request);
    expect(user).toEqual(mockUser);
    expect(getServerSession).toHaveBeenCalled();
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: "users",
      id: "user-2",
    });
  });

  it("returns null when neither auth method provides a user", async () => {
    const mockPayload = {
      auth: vi.fn().mockResolvedValue({ user: null }),
    };
    vi.mocked(getPayload).mockResolvedValue(mockPayload as any);
    vi.mocked(getServerSession).mockResolvedValue(null);

    // No payload-token cookie so it goes straight to NextAuth
    const request = buildRequest({});

    const user = await getCurrentUser(request);
    expect(user).toBeNull();
  });
});
