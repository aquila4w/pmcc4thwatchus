import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest } from "../../helpers/mock-request";
import { mockChurch, mockSubDistrict } from "../../helpers/fixtures";

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
import { POST } from "@/app/api/auth/register/route";

describe("POST /api/auth/register", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    vi.clearAllMocks();

    const mock = createMockPayload({
      stores: {
        users: [],
        churches: [mockChurch],
        "sub-districts": [mockSubDistrict],
      },
    });
    payload = mock.payload;
    vi.mocked(getPayload).mockResolvedValue(payload as any);
  });

  // ---- Success cases ----

  it("successfully creates user with pending status", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: {
        name: "New User",
        email: "newuser@example.com",
        password: "Password1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe(
      "Registration successful! Your account is pending approval."
    );
    expect(json.user.status).toBe("pending");
  });

  it("returns user id, name, email, status in response", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: {
        name: "Jane Doe",
        email: "janedoe@example.com",
        password: "SecurePass1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user).toHaveProperty("id");
    expect(json.user.name).toBe("Jane Doe");
    expect(json.user.email).toBe("janedoe@example.com");
    expect(json.user.status).toBe("pending");
  });

  // ---- Missing field validations ----

  it("returns 400 when name missing", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: {
        email: "test@example.com",
        password: "Password1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("required");
  });

  it("returns 400 when email missing", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: {
        name: "Test User",
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
      url: "http://localhost:3000/api/auth/register",
      body: {
        name: "Test User",
        email: "test@example.com",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("required");
  });

  // ---- Email format validation ----

  it("returns 400 for invalid email format", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: {
        name: "Test User",
        email: "not-an-email",
        password: "Password1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid email format");
  });

  // ---- Password strength validations ----

  it("returns 400 for password < 8 chars", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "Aa1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("8 characters");
  });

  it("returns 400 for password without uppercase", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "password1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("uppercase");
  });

  it("returns 400 for password without lowercase", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "PASSWORD1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("lowercase");
  });

  it("returns 400 for password without digit", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "Password!!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("number");
  });

  it("returns 400 for password without special char", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "Password12",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("special character");
  });

  // ---- Duplicate email ----

  it("returns 400 when email already exists", async () => {
    // Pre-seed a user with the same email
    const mock = createMockPayload({
      stores: {
        users: [
          {
            id: "existing-1",
            name: "Existing User",
            email: "taken@example.com",
            role: "member",
          },
        ],
        churches: [mockChurch],
      },
    });
    payload = mock.payload;
    vi.mocked(getPayload).mockResolvedValue(payload as any);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: {
        name: "New User",
        email: "taken@example.com",
        password: "Password1!",
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("already exists");
  });

  // ---- SubDistrict resolution ----

  it("resolves subDistrict from church when provided", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: {
        name: "Church Member",
        email: "churchmember@example.com",
        password: "Password1!",
        church: mockChurch.id,
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);

    // Verify payload.create was called with subDistrict resolved from the church
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        data: expect.objectContaining({
          subDistrict: mockSubDistrict.id,
          church: mockChurch.id,
        }),
      })
    );
  });
});
