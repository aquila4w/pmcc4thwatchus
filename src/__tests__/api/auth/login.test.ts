import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest } from "../../helpers/mock-request";
import { mockMember, mockChurch } from "../../helpers/fixtures";

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
  rateLimitAsync: vi.fn(async () => ({ allowed: true, remaining: 99, resetIn: 60000 })),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@payload-config", () => ({
  default: {},
}));

// Import mocked modules so vi.mock interception is active
import { getPayload } from "payload";
import { POST } from "@/app/api/auth/login/route";

describe("POST /api/auth/login", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    vi.clearAllMocks();

    const mock = createMockPayload({
      stores: {
        users: [
          {
            ...mockMember,
            password: "Password1!",
          },
        ],
        churches: [mockChurch],
      },
    });
    payload = mock.payload;
    vi.mocked(getPayload).mockResolvedValue(payload as unknown as Awaited<ReturnType<typeof getPayload>>);
  });

  // ---- Success cases ----

  it("successfully authenticates and returns user with id, email, name, phone, role, inviteCode", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/login",
      body: {
        email: mockMember.email,
        password: "Password1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.user).toHaveProperty("id", mockMember.id);
    expect(json.user).toHaveProperty("email", mockMember.email);
    expect(json.user).toHaveProperty("name", mockMember.name);
    expect(json.user).toHaveProperty("phone", mockMember.phone);
    expect(json.user).toHaveProperty("role", mockMember.role);
    expect(json.user).toHaveProperty("inviteCode", mockMember.inviteCode);
  });

  it("sets payload-token cookie with correct options", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/login",
      body: {
        email: mockMember.email,
        password: "Password1!",
      },
    });

    const response = await POST(request);

    // Extract the Set-Cookie header
    const setCookieHeader = response.headers.get("set-cookie");
    expect(setCookieHeader).toContain("payload-token");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("Max-Age=604800"); // 7 days = 60 * 60 * 24 * 7
    expect(setCookieHeader).toContain("Path=/");
    expect(setCookieHeader).toContain("SameSite=lax");
  });

  it("resolves and returns church name", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/login",
      body: {
        email: mockMember.email,
        password: "Password1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user.church).toBe(mockChurch.name);

    // Verify church was looked up
    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "churches",
        id: mockMember.church,
      })
    );
  });

  // ---- Missing field validations ----

  it("returns 400 when email missing", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/login",
      body: {
        password: "Password1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("required");
  });

  it("returns 400 when password missing", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/login",
      body: {
        email: "test@example.com",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("required");
  });

  // ---- Authentication failure ----

  it("returns 401 with invalid credentials (payload.login throws)", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/login",
      body: {
        email: "nonexistent@example.com",
        password: "WrongPass1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toContain("Invalid");
  });

  // ---- Unexpected error ----

  it("returns 500 on unexpected error", async () => {
    // Override payload.login to throw a non-credentials error
    payload.login.mockRejectedValueOnce(new Error("Database connection failed"));

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/login",
      body: {
        email: "test@example.com",
        password: "Password1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Login failed");
  });

  // ---- PII preservation ----

  it("returns user phone in response", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/login",
      body: {
        email: mockMember.email,
        password: "Password1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user.phone).toBe(mockMember.phone);
  });
});
