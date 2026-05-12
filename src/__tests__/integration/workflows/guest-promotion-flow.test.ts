import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupModuleMocks, mockGetPayload, mockAuthenticatedUser, mockPayloadAuth } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockGuest,
  mockEvent,
  mockChurch,
  mockEventInvite,
  mockSubDistrict,
} from "../../helpers/fixtures";

// Use vi.hoisted so these are available when vi.mock factories run
const { _sendRegistrationEmail, _sendRegistrationSMS } = vi.hoisted(() => ({
  _sendRegistrationEmail: vi.fn().mockResolvedValue({ success: true }),
  _sendRegistrationSMS: vi.fn().mockResolvedValue({ success: true }),
}));

setupModuleMocks();

vi.mock("@/lib/email", () => ({
  sendRegistrationEmail: _sendRegistrationEmail,
}));

vi.mock("@/lib/sms", () => ({
  sendRegistrationSMS: _sendRegistrationSMS,
}));

// Mock global fetch for reCAPTCHA verification
global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ success: true }),
});

// Set required env vars
process.env.GOOGLE_RECAPTCHA_SECRET_KEY = "test-secret-key";
process.env.NEXT_PUBLIC_SERVER_URL = "https://pmcc4thwatch.us";

// Import after mocks are set up
import { POST as registerPOST } from "@/app/api/register/route";
import { POST as checkinPOST } from "@/app/api/check-in/route";
import { POST as baptismPOST } from "@/app/api/baptism/route";
import { POST as promotePOST } from "@/app/api/guests/[guestId]/promote/route";

describe("Guest Promotion Flow: Register -> Check-in -> Baptize -> Promote to member", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];
  let data: ReturnType<typeof createMockPayload>["data"];

  const guestInfo = {
    firstName: "Carlos",
    lastName: "Convert",
    email: "carlos@example.com",
    phone: "+15557776666",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const mock = createMockPayload({
      stores: {
        users: [
          { ...mockMember, church: { id: "church-1", name: "PMCC LA Church" } },
          mockSuperAdmin,
          mockGuest,
        ],
        "managed-events": [mockEvent],
        "event-registrations": [],
        "event-invites": [mockEventInvite],
        churches: [{ ...mockChurch, subDistrict: mockSubDistrict }],
        subdistricts: [mockSubDistrict],
      },
    });
    payload = mock.payload;
    data = mock.data;
    mockGetPayload(payload);

    // Set up auth for admin user (for promote endpoint which uses payload.auth)
    mockPayloadAuth(payload, mockSuperAdmin);
  });

  it("step 1: POST /api/register creates a guest user", async () => {
    mockAuthenticatedUser(mockSuperAdmin);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        ...guestInfo,
        recaptchaToken: "valid-token",
      },
    });

    const response = await registerPOST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.registration.status).toBe("registered");

    // Verify guest user was created
    const guestUsers = data.users.filter(
      (u) => (u as Record<string, unknown>).role === "guest"
    );
    expect(guestUsers.length).toBeGreaterThanOrEqual(1);
    const createdGuest = guestUsers.find(
      (u) => (u as Record<string, unknown>).name === "Carlos Convert"
    );
    expect(createdGuest).toBeDefined();
  });

  it("step 2: POST /api/check-in marks guest as attended", async () => {
    mockAuthenticatedUser(mockSuperAdmin);

    // Register
    const regRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        ...guestInfo,
        recaptchaToken: "valid-token",
      },
    });
    const regResponse = await registerPOST(regRequest);
    const regResult = await regResponse.json();
    const code = regResult.registration.code;

    // Check in
    const checkinRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: { registrationCode: code, eventId: "event-1" },
    });

    const checkinResponse = await checkinPOST(checkinRequest);
    const checkinResult = await checkinResponse.json();

    expect(checkinResult.success).toBe(true);
    expect(checkinResult.registration.status).toBe("attended");
  });

  it("step 3: POST /api/baptism marks guest as baptized", async () => {
    mockAuthenticatedUser(mockSuperAdmin);

    // Register -> check-in
    const regRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        ...guestInfo,
        recaptchaToken: "valid-token",
      },
    });
    const regResponse = await registerPOST(regRequest);
    const regResult = await regResponse.json();
    const code = regResult.registration.code;

    await checkinPOST(
      buildRequest({
        method: "POST",
        url: "http://localhost:3000/api/check-in",
        body: { registrationCode: code, eventId: "event-1" },
      })
    );

    // Baptize
    const baptismRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/baptism",
      body: { registrationCode: code, eventId: "event-1" },
    });

    const baptismResponse = await baptismPOST(baptismRequest);
    const baptismResult = await baptismResponse.json();

    expect(baptismResult.success).toBe(true);
    expect(baptismResult.registration.status).toBe("baptized");
  });

  it("step 4: POST /api/guests/[guestId]/promote promotes guest to member with churchId", async () => {
    mockAuthenticatedUser(mockSuperAdmin);

    // Register -> check-in -> baptize to create a fully eligible guest
    const regRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        ...guestInfo,
        recaptchaToken: "valid-token",
      },
    });
    const regResponse = await registerPOST(regRequest);
    const regResult = await regResponse.json();
    const code = regResult.registration.code;

    await checkinPOST(
      buildRequest({
        method: "POST",
        url: "http://localhost:3000/api/check-in",
        body: { registrationCode: code, eventId: "event-1" },
      })
    );

    await baptismPOST(
      buildRequest({
        method: "POST",
        url: "http://localhost:3000/api/baptism",
        body: { registrationCode: code, eventId: "event-1" },
      })
    );

    // Find the created guest user
    const guestUser = data.users.find(
      (u) =>
        (u as Record<string, unknown>).name === "Carlos Convert" &&
        (u as Record<string, unknown>).role === "guest"
    );
    expect(guestUser).toBeDefined();
    const guestId = (guestUser as Record<string, unknown>).id as string;

    // Promote the guest to member
    const promoteRequest = buildRequest({
      method: "POST",
      url: `http://localhost:3000/api/guests/${guestId}/promote`,
      body: { churchId: "church-1" },
      cookies: { "payload-token": "mock-token" },
    });
    const promoteContext = buildParams({ guestId });

    const promoteResponse = await promotePOST(promoteRequest, promoteContext);
    const promoteResult = await promoteResponse.json();

    expect(promoteResponse.status).toBe(200);
    expect(promoteResult.success).toBe(true);
    expect(promoteResult.user.role).toBe("member");
    expect(promoteResult.user.church).toBe("church-1");
    expect(promoteResult.user.inviteCode).toBeDefined();
    expect(promoteResult.church.name).toBe("PMCC LA Church");

    // Verify the user was updated in the data store
    const updatedUser = data.users.find(
      (u) => (u as Record<string, unknown>).id === guestId
    );
    expect((updatedUser as Record<string, unknown>)?.role).toBe("member");
  });

  it("step 5: welcome email is sent with guest email and name", async () => {
    mockAuthenticatedUser(mockSuperAdmin);

    // Full flow: register -> check-in -> baptize -> promote
    const regRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        ...guestInfo,
        recaptchaToken: "valid-token",
      },
    });
    const regResponse = await registerPOST(regRequest);
    const regResult = await regResponse.json();
    const code = regResult.registration.code;

    await checkinPOST(
      buildRequest({
        method: "POST",
        url: "http://localhost:3000/api/check-in",
        body: { registrationCode: code, eventId: "event-1" },
      })
    );

    await baptismPOST(
      buildRequest({
        method: "POST",
        url: "http://localhost:3000/api/baptism",
        body: { registrationCode: code, eventId: "event-1" },
      })
    );

    const guestUser = data.users.find(
      (u) =>
        (u as Record<string, unknown>).name === "Carlos Convert" &&
        (u as Record<string, unknown>).role === "guest"
    );
    const guestId = (guestUser as Record<string, unknown>).id as string;

    // Clear previous email calls from registration
    _sendRegistrationEmail.mockClear();

    // Promote
    const promoteRequest = buildRequest({
      method: "POST",
      url: `http://localhost:3000/api/guests/${guestId}/promote`,
      body: { churchId: "church-1" },
      cookies: { "payload-token": "mock-token" },
    });
    await promotePOST(promoteRequest, buildParams({ guestId }));

    // Verify welcome email was sent during promotion
    expect(_sendRegistrationEmail).toHaveBeenCalled();
    const lastCall = _sendRegistrationEmail.mock.calls[0][0];
    expect(lastCall.to).toBe("carlos@example.com");
    expect(lastCall.guestName).toBe("Carlos Convert");
    expect(lastCall.eventTitle).toBe("Welcome to PMCC 4th Watch");
  });
});
