import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockRegistration,
  mockCampaign,
} from "../../helpers/fixtures";

// Setup module mocks at top level (hoisted by Vitest)
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
  sendRegistrationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/sms", () => ({
  sendRegistrationSMS: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/campaigns", async () => {
  const actual = await vi.importActual("@/lib/campaigns");
  return {
    ...actual,
    updateCampaignStatus: vi.fn().mockResolvedValue(undefined),
  };
});

import { POST, GET } from "@/app/api/campaigns/[id]/send/route";
import { sendRegistrationEmail } from "@/lib/email";
import { sendRegistrationSMS } from "@/lib/sms";

describe("POST /api/campaigns/[id]/send", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  function setupCampaignStore(overrides: Record<string, unknown[]> = {}) {
    const campaignWithEvent = {
      ...mockCampaign,
      event: {
        id: "event-1",
        title: "Summer Crusade 2026",
        startDate: "2026-07-15T10:00:00.000Z",
        location: "LA Convention Center",
      },
    };

    // Registration must have event as a string ID for where-clause matching
    const registrationWithGuestInfo = {
      id: "reg-1",
      inviteCode: "REGCODE1",
      event: "event-1",
      status: "registered",
      guestInfo: {
        name: "Jane Guest",
        email: "jane@example.com",
        phone: "+15551003000",
      },
    };

    const mock = createMockPayload({
      stores: {
        campaigns: [campaignWithEvent],
        "event-registrations": [registrationWithGuestInfo],
        ...overrides,
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
    return mock;
  }

  // 1. Sends emails with guest name placeholder replaced (PII)
  it("sends emails with guest name placeholder replaced", async () => {
    setupCampaignStore();

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/campaigns/campaign-1/send",
    });

    const response = await POST(request, { params: Promise.resolve({ id: "campaign-1" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.sentCount).toBeGreaterThan(0);

    expect(sendRegistrationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jane@example.com",
        guestName: "Jane Guest",
      })
    );
  });

  // 2. Sends SMS with guest name
  it("sends SMS with guest name to registered guests", async () => {
    setupCampaignStore();

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/campaigns/campaign-1/send",
    });

    const response = await POST(request, { params: Promise.resolve({ id: "campaign-1" }) });
    const json = await response.json();

    expect(response.status).toBe(200);

    expect(sendRegistrationSMS).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "+15551003000",
        guestName: "Jane Guest",
      })
    );
  });

  // 3. Returns 401/403
  it("returns 401 when not authenticated", async () => {
    setupCampaignStore();
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/campaigns/campaign-1/send",
    });

    const response = await POST(request, { params: Promise.resolve({ id: "campaign-1" }) });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Authentication required");
  });

  it("returns 403 when user is not admin", async () => {
    setupCampaignStore();
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/campaigns/campaign-1/send",
    });

    const response = await POST(request, { params: Promise.resolve({ id: "campaign-1" }) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Insufficient permissions");
  });

  // 4. Returns 404 campaign not found
  it("returns 404 when campaign not found", async () => {
    setupCampaignStore({
      campaigns: [], // No campaigns
    });

    // Override findByID to return null for nonexistent campaign
    payload.findByID = vi.fn(async ({ collection, id }: { collection: string; id: string }) => {
      if (collection === "campaigns" && id === "nonexistent") return null;
      throw new Error(`Document with id ${id} not found in ${collection}`);
    });

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/campaigns/nonexistent/send",
    });

    const response = await POST(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Campaign not found");
  });
});

describe("GET /api/campaigns/[id]/send", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const campaignWithEvent = {
      ...mockCampaign,
      event: { id: "event-1", title: "Summer Crusade 2026" },
    };

    const registrationWithGuestInfo = {
      id: "reg-1",
      inviteCode: "REGCODE1",
      event: "event-1",
      status: "registered",
      guestInfo: {
        name: "Jane Guest",
        email: "jane@example.com",
        phone: "+15551003000",
      },
    };

    const mock = createMockPayload({
      stores: {
        campaigns: [campaignWithEvent],
        "event-registrations": [registrationWithGuestInfo],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  // 5. Returns recipient counts
  it("returns recipient counts and preview data", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/campaigns/campaign-1/send",
    });

    const response = await GET(request, { params: Promise.resolve({ id: "campaign-1" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.campaignId).toBe("campaign-1");
    expect(json.campaignName).toBe("Reminder Campaign");
    expect(json.type).toBe("both");
    expect(json.targetAudience).toBe("all");
    expect(json.totalRecipients).toBeDefined();
    expect(json.withEmail).toBeDefined();
    expect(json.withPhone).toBeDefined();
    expect(json.recipients).toBeDefined();
  });

  // 6. Returns 401/403
  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/campaigns/campaign-1/send",
    });

    const response = await GET(request, { params: Promise.resolve({ id: "campaign-1" }) });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Authentication required");
  });

  it("returns 403 when user is not admin", async () => {
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/campaigns/campaign-1/send",
    });

    const response = await GET(request, { params: Promise.resolve({ id: "campaign-1" }) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Insufficient permissions");
  });
});
