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

// Use vi.hoisted for the Resend mock so it's available at hoist time
const { _resendSendMock } = vi.hoisted(() => {
  const sendMock = vi.fn().mockResolvedValue({ data: { id: "email-waitlist-123" }, error: null });
  return { _resendSendMock: sendMock };
});

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function() {
    this.emails = {
      send: _resendSendMock,
    };
  }),
}));

// Set required env vars
process.env.GOOGLE_RECAPTCHA_SECRET_KEY = "test-secret-key";
process.env.NEXT_PUBLIC_SERVER_URL = "https://pmcc4thwatch.us";
process.env.RESEND_API_KEY = "test-resend-key";

// Import after mocks are set up
import { POST as registerPOST } from "@/app/api/register/route";
import { POST as waitlistPromotePOST } from "@/app/api/waitlist/promote/route";

describe("Waitlist Flow: Fill event -> Register to waitlist -> Promote from waitlist", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];
  let data: ReturnType<typeof createMockPayload>["data"];

  // Create a small-capacity event for waitlist testing
  const smallEvent = {
    ...mockEvent,
    id: "event-small",
    title: "Small Workshop 2026",
    slug: "small-workshop-2026",
    maxAttendees: 2,
    maxCapacity: 2,
  };

  // Create registrations that fill the event to capacity
  const fillingRegistrations = [
    {
      id: "reg-fill-1",
      inviteCode: "FILL001",
      event: "event-small",
      guestInfo: { name: "First Guest", email: "first@example.com", phone: "+15551111001" },
      status: "registered",
      registeredAt: "2026-06-01T12:00:00.000Z",
    },
    {
      id: "reg-fill-2",
      inviteCode: "FILL002",
      event: "event-small",
      guestInfo: { name: "Second Guest", email: "second@example.com", phone: "+15551111002" },
      status: "registered",
      registeredAt: "2026-06-01T12:05:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    const mock = createMockPayload({
      stores: {
        users: [
          { ...mockMember, church: { id: "church-1", name: "PMCC LA Church" } },
          mockSuperAdmin,
        ],
        "managed-events": [smallEvent, mockEvent],
        "event-registrations": [...fillingRegistrations],
        "event-invites": [mockEventInvite],
        churches: [mockChurch],
      },
    });
    payload = mock.payload;
    data = mock.data;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("step 1: event capacity is filled with existing registrations", async () => {
    const registrationsForEvent = data["event-registrations"].filter(
      (r) => (r as Record<string, unknown>).event === "event-small"
    );
    expect(registrationsForEvent.length).toBe(2);
    expect(smallEvent.maxAttendees).toBe(2);
  });

  it("step 2: POST /api/register with joinWaitlist creates waitlisted registration", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "small-workshop-2026",
        firstName: "Waitlist",
        lastName: "Person",
        email: "waitlist@example.com",
        phone: "+15553334444",
        recaptchaToken: "valid-token",
        joinWaitlist: true,
      },
    });

    const response = await registerPOST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.isWaitlisted).toBe(true);
    expect(result.waitlistPosition).toBeGreaterThanOrEqual(1);
    expect(result.registration.status).toBe("waitlisted");

    // Verify stored data
    const waitlistRegs = data["event-registrations"].filter(
      (r) => (r as Record<string, unknown>).status === "waitlisted"
    );
    expect(waitlistRegs.length).toBe(1);
    const storedWaitlist = waitlistRegs[0] as Record<string, unknown>;
    expect((storedWaitlist.guestInfo as Record<string, unknown>)?.name).toBe("Waitlist Person");
    expect(storedWaitlist.waitlistPosition).toBe(1);
  });

  it("step 3: POST /api/waitlist/promote promotes waitlisted registrations", async () => {
    // First, add a waitlisted registration to the store
    data["event-registrations"].push({
      id: "reg-waitlist-1",
      inviteCode: "WAITCODE1",
      event: "event-small",
      guestInfo: { name: "Waitlist Person", email: "waitlist@example.com", phone: "+15553334444" },
      guestName: "Waitlist Person",
      guestEmail: "waitlist@example.com",
      ticketCode: "WAITCODE1",
      status: "waitlisted",
      waitlistPosition: 1,
      registeredAt: new Date().toISOString(),
    });

    // Simulate one confirmed spot opening up by reducing confirmed count
    // The promote endpoint checks for "confirmed" status count
    // We'll update one of the filling registrations to a different status
    // so that there's an available spot
    const fillReg = data["event-registrations"].find(
      (r) => (r as Record<string, unknown>).id === "reg-fill-1"
    ) as Record<string, unknown>;
    if (fillReg) {
      fillReg.status = "confirmed";
    }
    // Update the other to confirmed too, to match the capacity
    const fillReg2 = data["event-registrations"].find(
      (r) => (r as Record<string, unknown>).id === "reg-fill-2"
    ) as Record<string, unknown>;
    if (fillReg2) {
      fillReg2.status = "confirmed";
    }

    // Now the event has 2 confirmed (full), but when we promote,
    // it should still work since maxCapacity - confirmed = 0
    // Let's instead set maxCapacity higher so there's room
    const eventInStore = data["managed-events"].find(
      (e) => (e as Record<string, unknown>).id === "event-small"
    ) as Record<string, unknown>;
    eventInStore.maxCapacity = 3;

    const promoteRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/waitlist/promote",
      body: {
        eventId: "event-small",
        count: 1,
      },
    });

    const response = await waitlistPromotePOST(promoteRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.promoted).toBe(1);
    expect(result.promotedRegistrations).toBeDefined();
    expect(result.promotedRegistrations[0].guestName).toBe("Waitlist Person");

    // Verify the waitlisted registration was updated to confirmed
    const promotedReg = data["event-registrations"].find(
      (r) => (r as Record<string, unknown>).id === "reg-waitlist-1"
    ) as Record<string, unknown>;
    expect(promotedReg.status).toBe("confirmed");
    expect(promotedReg.waitlistPosition).toBeNull();
  });

  it("step 4: promoted registration data preserved with PII and confirmation", async () => {
    // Remove all existing registrations and add just a waitlisted one
    data["event-registrations"] = [
      {
        id: "reg-waitlist-2",
        inviteCode: "WAITCODE2",
        event: "event-small",
        guestInfo: { name: "Notify Person", email: "notify@example.com", phone: "+15553335555" },
        guestName: "Notify Person",
        guestEmail: "notify@example.com",
        ticketCode: "WAITCODE2",
        status: "waitlisted",
        waitlistPosition: 1,
        registeredAt: new Date().toISOString(),
      },
    ];

    // Make room by increasing capacity (no confirmed registrations, so all spots available)
    const eventInStore = data["managed-events"].find(
      (e) => (e as Record<string, unknown>).id === "event-small"
    ) as Record<string, unknown>;
    eventInStore.maxCapacity = 10;

    const promoteRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/waitlist/promote",
      body: { eventId: "event-small", count: 1 },
    });

    const response = await waitlistPromotePOST(promoteRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.promoted).toBe(1);

    // Verify promoted registration PII preserved
    expect(result.promotedRegistrations[0].guestName).toBe("Notify Person");
    expect(result.promotedRegistrations[0].guestEmail).toBe("notify@example.com");

    // Verify stored registration was updated to confirmed
    const promotedReg = data["event-registrations"].find(
      (r) => (r as Record<string, unknown>).id === "reg-waitlist-2"
    ) as Record<string, unknown>;
    expect(promotedReg.status).toBe("confirmed");
    expect(promotedReg.waitlistPosition).toBeNull();
    expect(promotedReg.promotedFromWaitlistAt).toBeDefined();
  });
});
