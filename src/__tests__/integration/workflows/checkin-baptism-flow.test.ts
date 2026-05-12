import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupModuleMocks, mockGetPayload, mockAuthenticatedUser } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockGuest,
  mockEvent,
  mockChurch,
  mockEventInvite,
  mockRegistration,
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
import { POST as checkinPOST, GET as checkinGET } from "@/app/api/check-in/route";
import { POST as baptismPOST } from "@/app/api/baptism/route";

describe("Check-in & Baptism Flow: Register -> Check-in -> Baptism -> Status progression", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];
  let data: ReturnType<typeof createMockPayload>["data"];

  const registeredGuestInfo = {
    firstName: "Bob",
    lastName: "Attendee",
    email: "bob@example.com",
    phone: "+15558887777",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const mock = createMockPayload({
      stores: {
        users: [
          { ...mockMember, church: { id: "church-1", name: "PMCC LA Church" } },
          mockSuperAdmin,
        ],
        "managed-events": [mockEvent],
        "event-registrations": [],
        "event-invites": [mockEventInvite],
        churches: [mockChurch],
      },
    });
    payload = mock.payload;
    data = mock.data;
    mockGetPayload(payload);
  });

  it("step 1: POST /api/register creates registration with status 'registered'", async () => {
    // Authenticate as admin so check-in/baptism work later
    mockAuthenticatedUser(mockSuperAdmin);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        ...registeredGuestInfo,
        recaptchaToken: "valid-token",
      },
    });

    const response = await registerPOST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.registration.status).toBe("registered");

    // Verify stored data
    const storedReg = data["event-registrations"][0] as Record<string, unknown>;
    expect(storedReg.status).toBe("registered");
    expect((storedReg.guestInfo as Record<string, unknown>)?.name).toBe("Bob Attendee");
  });

  it("step 2: POST /api/check-in changes status to 'attended'", async () => {
    mockAuthenticatedUser(mockSuperAdmin);

    // Register the guest first
    const regRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        ...registeredGuestInfo,
        recaptchaToken: "valid-token",
      },
    });

    const regResponse = await registerPOST(regRequest);
    const regResult = await regResponse.json();
    const code = regResult.registration.code;

    // Now check in the guest
    const checkinRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: {
        registrationCode: code,
        eventId: "event-1",
      },
    });

    const checkinResponse = await checkinPOST(checkinRequest);
    const checkinResult = await checkinResponse.json();

    expect(checkinResponse.status).toBe(200);
    expect(checkinResult.success).toBe(true);
    expect(checkinResult.message).toBe("Check-in successful");
    expect(checkinResult.registration.status).toBe("attended");
    expect(checkinResult.registration.guestName).toBe("Bob Attendee");
    expect(checkinResult.registration.attendedAt).toBeDefined();

    // Verify stored data updated
    const storedReg = data["event-registrations"][0] as Record<string, unknown>;
    expect(storedReg.status).toBe("attended");
    expect(storedReg.attendedAt).toBeDefined();
  });

  it("step 3: POST /api/baptism changes status to 'baptized'", async () => {
    mockAuthenticatedUser(mockSuperAdmin);

    // Register the guest
    const regRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        ...registeredGuestInfo,
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
      body: {
        registrationCode: code,
        eventId: "event-1",
      },
    });
    await checkinPOST(checkinRequest);

    // Now record baptism
    const baptismRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/baptism",
      body: {
        registrationCode: code,
        eventId: "event-1",
      },
    });

    const baptismResponse = await baptismPOST(baptismRequest);
    const baptismResult = await baptismResponse.json();

    expect(baptismResponse.status).toBe(200);
    expect(baptismResult.success).toBe(true);
    expect(baptismResult.message).toBe("Baptism recorded successfully");
    expect(baptismResult.registration.status).toBe("baptized");
    expect(baptismResult.registration.guestName).toBe("Bob Attendee");
    expect(baptismResult.registration.baptizedAt).toBeDefined();
    expect(baptismResult.registration.attendedAt).toBeDefined();

    // Verify stored data updated
    const storedReg = data["event-registrations"][0] as Record<string, unknown>;
    expect(storedReg.status).toBe("baptized");
    expect(storedReg.baptizedAt).toBeDefined();
  });

  it("step 4: GET /api/check-in returns ALREADY_CHECKED_IN for baptized guest", async () => {
    mockAuthenticatedUser(mockSuperAdmin);

    // Register -> check-in -> baptize
    const regRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        ...registeredGuestInfo,
        recaptchaToken: "valid-token",
      },
    });
    const regResponse = await registerPOST(regRequest);
    const regResult = await regResponse.json();
    const code = regResult.registration.code;

    // Check in
    await checkinPOST(
      buildRequest({
        method: "POST",
        url: "http://localhost:3000/api/check-in",
        body: { registrationCode: code, eventId: "event-1" },
      })
    );

    // Record baptism
    await baptismPOST(
      buildRequest({
        method: "POST",
        url: "http://localhost:3000/api/baptism",
        body: { registrationCode: code, eventId: "event-1" },
      })
    );

    // Try to check in again — should return ALREADY_CHECKED_IN
    const reCheckinRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/check-in",
      body: { registrationCode: code, eventId: "event-1" },
    });

    const reCheckinResponse = await checkinPOST(reCheckinRequest);
    const reCheckinResult = await reCheckinResponse.json();

    expect(reCheckinResponse.status).toBe(200);
    expect(reCheckinResult.success).toBe(false);
    expect(reCheckinResult.code).toBe("ALREADY_CHECKED_IN");
    expect(reCheckinResult.registration.status).toBe("baptized");
  });
});
