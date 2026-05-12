import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupModuleMocks, mockGetPayload, mockAuthenticatedUser } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockMember,
  mockChurch,
  mockEvent,
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

// Set required env vars
process.env.GOOGLE_RECAPTCHA_SECRET_KEY = "test-secret-key";
process.env.NEXT_PUBLIC_SERVER_URL = "https://pmcc4thwatch.us";

// Import after mocks are set up
import { GET } from "@/app/api/invite/[memberCode]/route";
import { POST as registerPOST } from "@/app/api/register/route";
import { GET as ticketGET } from "@/app/api/ticket/[code]/pdf/route";

describe("Registration Flow: Invite -> Register -> Email/SMS -> Ticket", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];
  let data: ReturnType<typeof createMockPayload>["data"];

  beforeEach(() => {
    vi.clearAllMocks();

    const mock = createMockPayload({
      stores: {
        users: [
          { ...mockMember, church: { id: "church-1", name: "PMCC LA Church" } },
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

  it("step 1: GET /api/invite/[memberCode] returns member info and available events", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/invite/MEMBR01A2",
    });
    const context = buildParams({ memberCode: "MEMBR01A2" });

    const response = await GET(request, context);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.member).toBeDefined();
    expect(result.member.name).toBe("John Member");
    expect(result.member.church).toBe("PMCC LA Church");

    expect(result.events).toBeDefined();
    expect(result.events.length).toBeGreaterThanOrEqual(1);
    expect(result.events[0].slug).toBe("summer-crusade-2026");
    expect(result.events[0].title).toBe("Summer Crusade 2026");
  });

  it("step 2: POST /api/register creates registration with refCode + eventSlug", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        firstName: "Alice",
        lastName: "Newguest",
        email: "alice@example.com",
        phone: "+15559990000",
        recaptchaToken: "valid-token",
      },
    });

    const response = await registerPOST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.registration).toBeDefined();
    expect(result.registration.code).toBeDefined();
    expect(result.registration.status).toBe("registered");
    expect(result.isWaitlisted).toBeFalsy();
    expect(result.event.title).toBe("Summer Crusade 2026");

    // Verify data was stored in the mock payload
    expect(data["event-registrations"].length).toBe(1);
    const storedReg = data["event-registrations"][0] as Record<string, unknown>;
    expect((storedReg.guestInfo as Record<string, unknown>)?.name).toBe("Alice Newguest");
    expect(storedReg.status).toBe("registered");
    expect(storedReg.event).toBe("event-1");

    // A guest user should have been created
    expect(data.users.length).toBeGreaterThanOrEqual(2);
  });

  it("step 3: sendRegistrationEmail was called with guest name", async () => {
    // Trigger registration
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        firstName: "Alice",
        lastName: "Newguest",
        email: "alice@example.com",
        phone: "+15559990000",
        recaptchaToken: "valid-token",
      },
    });

    await registerPOST(request);

    // Verify sendRegistrationEmail was called
    expect(_sendRegistrationEmail).toHaveBeenCalled();
    const emailCall = _sendRegistrationEmail.mock.calls[0][0];
    expect(emailCall.guestName).toBe("Alice Newguest");
    expect(emailCall.to).toBe("alice@example.com");
    expect(emailCall.eventTitle).toBe("Summer Crusade 2026");
  });

  it("step 4: sendRegistrationSMS was called with guest name", async () => {
    // Trigger registration
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        firstName: "Alice",
        lastName: "Newguest",
        email: "alice@example.com",
        phone: "+15559990000",
        recaptchaToken: "valid-token",
      },
    });

    await registerPOST(request);

    // Verify sendRegistrationSMS was called
    expect(_sendRegistrationSMS).toHaveBeenCalled();
    const smsCall = _sendRegistrationSMS.mock.calls[0][0];
    expect(smsCall.guestName).toBe("Alice Newguest");
    expect(smsCall.to).toBe("+15559990000");
    expect(smsCall.eventTitle).toBe("Summer Crusade 2026");
  });

  it("step 5: GET /api/ticket/[code]/pdf returns HTML with guest name", async () => {
    // First, register a guest to get a code
    const regRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/register",
      body: {
        refCode: "MEMBR01A2",
        eventSlug: "summer-crusade-2026",
        firstName: "Alice",
        lastName: "Newguest",
        email: "alice@example.com",
        phone: "+15559990000",
        recaptchaToken: "valid-token",
      },
    });

    const regResponse = await registerPOST(regRequest);
    const regResult = await regResponse.json();
    const code = regResult.registration.code;

    // Now fetch the ticket PDF (HTML)
    const ticketRequest = buildRequest({
      method: "GET",
      url: `http://localhost:3000/api/ticket/${code}/pdf`,
    });
    const ticketContext = buildParams({ code });

    const ticketResponse = await ticketGET(ticketRequest, ticketContext);
    expect(ticketResponse.status).toBe(200);

    const html = await ticketResponse.text();
    expect(html).toContain("Alice Newguest");
    expect(html).toContain(code);
    expect(html).toContain("PMCC 4th Watch");
    // Note: Event title may render as "Event" since mock payload stores event as ID string
    // without populating the relation (depth: 2 not supported by mock)
    expect(html).toContain("ticket-qr");
  });
});
