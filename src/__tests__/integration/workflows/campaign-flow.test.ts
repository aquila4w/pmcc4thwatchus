import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockGetPayload, mockAuthenticatedUser } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockGuest,
  mockEvent,
  mockChurch,
  mockEventInvite,
  mockCampaign,
  mockRegistration,
} from "../../helpers/fixtures";

const { _sendRegistrationEmail, _sendRegistrationSMS } = vi.hoisted(() => ({
  _sendRegistrationEmail: vi.fn().mockResolvedValue({ success: true }),
  _sendRegistrationSMS: vi.fn().mockResolvedValue({ success: true }),
}));

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

vi.mock("@/lib/email", () => ({
  sendRegistrationEmail: _sendRegistrationEmail,
}));

vi.mock("@/lib/sms", () => ({
  sendRegistrationSMS: _sendRegistrationSMS,
}));

vi.mock("@/lib/campaigns", async () => {
  const actual = await vi.importActual("@/lib/campaigns");
  return {
    ...actual,
    updateCampaignStatus: vi.fn().mockResolvedValue(undefined),
  };
});

process.env.NEXT_PUBLIC_SERVER_URL = "https://pmcc4thwatch.us";

import { POST as campaignSendPOST } from "@/app/api/campaigns/[id]/send/route";

describe("Campaign Flow: Setup registrations -> Send campaign -> Verify dispatch", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];
  let data: ReturnType<typeof createMockPayload>["data"];

  const registeredReg1 = {
    ...mockRegistration,
    id: "reg-camp-1",
    inviteCode: "CAMPREG1",
    guestInfo: { name: "Diana Registered", email: "diana@example.com", phone: "+15551110001" },
    status: "registered",
    event: "event-1",
    invitedBy: "member-1",
  };

  const registeredReg2 = {
    ...mockRegistration,
    id: "reg-camp-2",
    inviteCode: "CAMPREG2",
    guestInfo: { name: "Erik Attended", email: "erik@example.com", phone: "+15551110002" },
    status: "attended",
    event: "event-1",
    invitedBy: "member-1",
  };

  const registeredReg3 = {
    ...mockRegistration,
    id: "reg-camp-3",
    inviteCode: "CAMPREG3",
    guestInfo: { name: "Fiona NoPhone", email: "fiona@example.com", phone: undefined },
    status: "registered",
    event: "event-1",
    invitedBy: "member-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const mock = createMockPayload({
      stores: {
        users: [mockSuperAdmin, mockMember, mockGuest],
        "managed-events": [mockEvent],
        "event-registrations": [registeredReg1, registeredReg2, registeredReg3],
        "event-invites": [mockEventInvite],
        churches: [mockChurch],
        campaigns: [
          {
            ...mockCampaign,
            event: { id: "event-1", title: "Summer Crusade 2026", startDate: "2026-07-15T10:00:00.000Z", location: "LA Convention Center" },
            type: "both",
            targetAudience: "all",
            subject: "See you at {{event}}, {{name}}!",
            smsContent: "Hi {{name}}, see you at {{event}}! {{qrLink}}",
            emailContent: "<p>Hi {{name}}, see you at {{event}}!</p>",
          },
        ],
      },
    });
    payload = mock.payload;
    data = mock.data;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("step 1: sets up several registrations in the data store", async () => {
    expect(data["event-registrations"].length).toBe(3);
    const statuses = data["event-registrations"].map((r) => (r as Record<string, unknown>).status);
    expect(statuses).toContain("registered");
    expect(statuses).toContain("attended");
  });

  it("step 2: POST /api/campaigns/[id]/send sends campaign to all recipients", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/campaigns/campaign-1/send",
    });
    const context = buildParams({ id: "campaign-1" });

    const response = await campaignSendPOST(request, context);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.sentCount).toBeGreaterThan(0);
    expect(result.totalRecipients).toBe(3);
  });

  it("step 3: emails sent with guest names replaced in content", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/campaigns/campaign-1/send",
    });
    const context = buildParams({ id: "campaign-1" });

    await campaignSendPOST(request, context);

    expect(_sendRegistrationEmail).toHaveBeenCalled();
    const emailCalls = _sendRegistrationEmail.mock.calls;
    const recipientNames = emailCalls.map((call: any) => call[0].guestName);

    expect(recipientNames).toContain("Diana Registered");
    expect(recipientNames).toContain("Erik Attended");
    expect(recipientNames).toContain("Fiona NoPhone");

    const dianaCall = emailCalls.find((c: any) => c[0].guestName === "Diana Registered");
    expect(dianaCall).toBeDefined();
    expect(dianaCall![0].subject).toContain("Summer Crusade 2026");
  });

  it("step 4: SMS sent with ticket URLs for recipients with phone", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/campaigns/campaign-1/send",
    });
    const context = buildParams({ id: "campaign-1" });

    await campaignSendPOST(request, context);

    expect(_sendRegistrationSMS).toHaveBeenCalled();
    const smsCalls = _sendRegistrationSMS.mock.calls;
    const smsRecipients = smsCalls.map((call: any) => call[0].guestName);

    expect(smsRecipients).toContain("Diana Registered");
    expect(smsRecipients).toContain("Erik Attended");

    const dianaSms = smsCalls.find((c: any) => c[0].guestName === "Diana Registered");
    expect(dianaSms).toBeDefined();
    expect(dianaSms![0].ticketUrl).toContain("/ticket/");
  });
});
