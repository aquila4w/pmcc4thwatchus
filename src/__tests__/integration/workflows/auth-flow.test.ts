import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupModuleMocks, mockGetPayload, mockAuthenticatedUser, mockPayloadAuth } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockChurch,
  mockEvent,
  mockSubDistrict,
} from "../../helpers/fixtures";

setupModuleMocks();

// Set required env vars
process.env.NEXT_PUBLIC_SERVER_URL = "https://pmcc4thwatch.us";

// Import after mocks are set up
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { GET as meGET } from "@/app/api/auth/me/route";

describe("Auth Flow: Register -> Login -> /me -> Role-based access", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];
  let data: ReturnType<typeof createMockPayload>["data"];

  const newUser = {
    name: "Grace Newuser",
    email: "grace@example.com",
    password: "StrongP@ss1!",
    phone: "+15556667777",
    church: "church-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const mock = createMockPayload({
      stores: {
        users: [mockSuperAdmin, mockMember],
        "managed-events": [mockEvent],
        "event-registrations": [],
        "event-invites": [],
        churches: [{ ...mockChurch, subDistrict: { id: "subdistrict-1", name: "California Sub-District" } }],
        subdistricts: [mockSubDistrict],
      },
    });
    payload = mock.payload;
    data = mock.data;
    mockGetPayload(payload);
  });

  it("step 1: POST /api/auth/register creates user with status 'pending'", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/register",
      body: newUser,
    });

    const response = await registerPOST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.message).toContain("pending approval");
    expect(result.user).toBeDefined();
    expect(result.user.name).toBe("Grace Newuser");
    expect(result.user.email).toBe("grace@example.com");
    expect(result.user.status).toBe("pending");

    // Verify stored in data
    const createdUser = data.users.find(
      (u) => (u as Record<string, unknown>).email === "grace@example.com"
    );
    expect(createdUser).toBeDefined();
    expect((createdUser as Record<string, unknown>).role).toBe("member");
    expect((createdUser as Record<string, unknown>).status).toBe("pending");
    expect((createdUser as Record<string, unknown>).authProvider).toBe("credentials");
  });

  it("step 2: POST /api/auth/login authenticates and returns user profile", async () => {
    // First register a user (the mock payload.login will authenticate them)
    // Add an approved user to the store for login
    data.users.push({
      id: "user-approved-1",
      name: "Grace Approved",
      email: "grace-approved@example.com",
      phone: "+15556667778",
      role: "member",
      status: "approved",
      inviteCode: "APPROVED1",
      church: "church-1",
      authProvider: "credentials",
    });

    // Mock payload.login to return the user
    payload.login.mockResolvedValueOnce({
      token: "mock-jwt-token-123",
      user: {
        id: "user-approved-1",
        name: "Grace Approved",
        email: "grace-approved@example.com",
        phone: "+15556667778",
        role: "member",
        inviteCode: "APPROVED1",
        church: "church-1",
      },
    });

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/auth/login",
      body: {
        email: "grace-approved@example.com",
        password: "StrongP@ss1!",
      },
    });

    const response = await loginPOST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.name).toBe("Grace Approved");
    expect(result.user.email).toBe("grace-approved@example.com");
    expect(result.user.role).toBe("member");
    expect(result.user.inviteCode).toBe("APPROVED1");

    // Verify cookie was set
    const setCookieHeader = response.headers.get("set-cookie");
    expect(setCookieHeader).toContain("payload-token");
  });

  it("step 3: GET /api/auth/me returns user data with name, email, phone (PII)", async () => {
    // Mock payload.auth to return an authenticated user
    mockPayloadAuth(payload, {
      id: "member-1",
      name: "John Member",
      email: "john@example.com",
      phone: "+15551002000",
      role: "member",
      inviteCode: "MEMBR01A2",
      church: "church-1",
    });

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/auth/me",
      cookies: { "payload-token": "mock-token" },
    });

    const response = await meGET(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.user).toBeDefined();
    // PII fields
    expect(result.user.name).toBe("John Member");
    expect(result.user.email).toBe("john@example.com");
    expect(result.user.phone).toBe("+15551002000");
    expect(result.user.role).toBe("member");
    expect(result.user.inviteCode).toBe("MEMBR01A2");
    // Church name resolved
    expect(result.user.church).toBe("PMCC LA Church");
    // Stats should be present
    expect(result.stats).toBeDefined();
  });

  it("step 4: admin endpoints return 403 for member role", async () => {
    // Authenticate as a regular member
    mockAuthenticatedUser(mockMember);

    // Try to access an admin-only endpoint: export
    const { GET: exportGET } = await import("@/app/api/events/[eventId]/export/route");

    const exportRequest = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export?format=json",
    });
    const exportContext = buildParams({ eventId: "event-1" });

    const exportResponse = await exportGET(exportRequest, exportContext);
    const exportResult = await exportResponse.json();

    expect(exportResponse.status).toBe(403);
    expect(exportResult.error).toBe("Insufficient permissions");
  });

  it("step 4b: admin endpoints return 200 for superAdmin role", async () => {
    // Authenticate as superAdmin
    mockAuthenticatedUser(mockSuperAdmin);

    const { GET: exportGET } = await import("@/app/api/events/[eventId]/export/route");

    const exportRequest = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export?format=json",
    });
    const exportContext = buildParams({ eventId: "event-1" });

    const exportResponse = await exportGET(exportRequest, exportContext);
    const exportResult = await exportResponse.json();

    expect(exportResponse.status).toBe(200);
    expect(exportResult.event).toBeDefined();
    expect(exportResult.event.title).toBe("Summer Crusade 2026");
  });
});
