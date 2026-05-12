import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendRegistrationSMS, getShortTicketUrl, shortenUrl } from "@/lib/sms";

// ---------------------------------------------------------------------------
// Mock global fetch for Twilio API calls
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ sid: "SM123" }),
  });
  global.fetch = mockFetch;
});

// ---------------------------------------------------------------------------
// Helper: extract the Body value from the fetch call's URLSearchParams body
// ---------------------------------------------------------------------------

function getBodyFromCall(callIndex: number): string {
  const callBody = mockFetch.mock.calls[callIndex][1].body as URLSearchParams;
  return callBody.get("Body") || "";
}

// ---------------------------------------------------------------------------
// sendRegistrationSMS
// ---------------------------------------------------------------------------

describe("sendRegistrationSMS", () => {
  const baseParams = {
    to: "5551234567",
    guestName: "Jane Guest",
    eventTitle: "Summer Crusade 2026",
    ticketUrl: "https://pmcc4thwatch.us/ticket/REGCODE1",
  };

  it("returns { success: false } when env vars are missing", async () => {
    const savedSid = process.env.TWILIO_ACCOUNT_SID;
    const savedToken = process.env.TWILIO_AUTH_TOKEN;
    const savedFrom = process.env.TWILIO_PHONE_NUMBER;

    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;

    const result = await sendRegistrationSMS(baseParams);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(mockFetch).not.toHaveBeenCalled();

    // Restore
    process.env.TWILIO_ACCOUNT_SID = savedSid;
    process.env.TWILIO_AUTH_TOKEN = savedToken;
    process.env.TWILIO_PHONE_NUMBER = savedFrom;
  });

  it("returns { success: true } on 200 response", async () => {
    const result = await sendRegistrationSMS(baseParams);
    expect(result.success).toBe(true);
  });

  it("returns { success: false } on non-200 response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: "Invalid phone number" }),
    });

    const result = await sendRegistrationSMS(baseParams);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("cleans phone number by stripping non-digits and adding +1", async () => {
    await sendRegistrationSMS({ ...baseParams, to: "(555) 123-4567" });

    const callBody = mockFetch.mock.calls[0][1].body as URLSearchParams;
    const toValue = callBody.get("To");
    expect(toValue).toBe("+15551234567");
  });

  it("keeps phone number starting with + as-is (after cleaning)", async () => {
    await sendRegistrationSMS({ ...baseParams, to: "+15551234567" });

    const callBody = mockFetch.mock.calls[0][1].body as URLSearchParams;
    const toValue = callBody.get("To");
    expect(toValue).toBe("+15551234567");
  });

  it("default message includes guestName", async () => {
    await sendRegistrationSMS(baseParams);
    expect(getBodyFromCall(0)).toContain("Jane Guest");
  });

  it("default message includes ticketUrl", async () => {
    await sendRegistrationSMS(baseParams);
    expect(getBodyFromCall(0)).toContain("https://pmcc4thwatch.us/ticket/REGCODE1");
  });

  it("custom message overrides default", async () => {
    await sendRegistrationSMS({
      ...baseParams,
      customMessage: "Custom SMS body here",
    });
    expect(getBodyFromCall(0)).toBe("Custom SMS body here");
  });

  it("default message includes invitedByName and invitedByPhone when provided", async () => {
    await sendRegistrationSMS({
      ...baseParams,
      invitedByName: "John Member",
      invitedByPhone: "+15551002000",
    });

    const body = getBodyFromCall(0);
    expect(body).toContain("John Member");
    expect(body).toContain("+15551002000");
  });
});

// ---------------------------------------------------------------------------
// getShortTicketUrl
// ---------------------------------------------------------------------------

describe("getShortTicketUrl", () => {
  it("returns correct format with base URL and code", () => {
    const result = getShortTicketUrl("ABC123");
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "https://pmcc4thwatch.us";
    expect(result).toBe(`${baseUrl}/t/ABC123`);
  });
});

// ---------------------------------------------------------------------------
// shortenUrl
// ---------------------------------------------------------------------------

describe("shortenUrl", () => {
  it("returns input URL unchanged (identity function)", async () => {
    const url = "https://pmcc4thwatch.us/ticket/LONGCODE123";
    const result = await shortenUrl(url);
    expect(result).toBe(url);
  });
});
