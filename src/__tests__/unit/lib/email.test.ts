import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Resend SDK with a proper class constructor that Vitest can recognize.
const mockSend = vi.fn().mockResolvedValue({ data: { id: "email-123" }, error: null });

vi.mock("resend", () => {
  return {
    Resend: vi.fn().mockImplementation(function (this: Record<string, unknown>, _apiKey: string) {
      this.emails = { send: mockSend };
    }),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseRegistrationParams = {
  to: "guest@example.com",
  guestName: "Jane Guest",
  eventTitle: "Summer Crusade 2026",
  eventDate: "July 15, 2026",
  eventLocation: "LA Convention Center",
  registrationCode: "REGCODE1",
  qrCodeUrl: "https://pmcc4thwatch.us/qr/REGCODE1.png",
  ticketUrl: "https://pmcc4thwatch.us/ticket/REGCODE1",
};

const baseReminderParams = {
  to: "guest@example.com",
  guestName: "Jane Guest",
  eventTitle: "Summer Crusade 2026",
  eventDate: "July 15, 2026",
  eventLocation: "LA Convention Center",
  ticketUrl: "https://pmcc4thwatch.us/ticket/REGCODE1",
  reminderType: "day-before" as const,
};

// ---------------------------------------------------------------------------
// sendRegistrationEmail
// ---------------------------------------------------------------------------

describe("sendRegistrationEmail", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockSend.mockResolvedValue({ data: { id: "email-123" }, error: null });
  });

  it("returns { success: false } when RESEND_API_KEY is not set", async () => {
    // Temporarily remove the API key. The module-level `resend` singleton is
    // already cached from setup.ts, so we must bypass it by deleting the key
    // and forcing a fresh module import that will see no key.
    const saved = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    vi.resetModules();

    vi.doMock("resend", () => ({
      Resend: vi.fn().mockImplementation(function (this: Record<string, unknown>, _key: string) {
        this.emails = { send: mockSend };
      }),
    }));

    const { sendRegistrationEmail: freshSend } = await import("@/lib/email");
    const result = await freshSend(baseRegistrationParams);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    // Restore env and modules
    process.env.RESEND_API_KEY = saved;
    vi.resetModules();
  });

  it("returns { success: true } on successful send", async () => {
    const { sendRegistrationEmail } = await import("@/lib/email");
    const result = await sendRegistrationEmail(baseRegistrationParams);
    expect(result.success).toBe(true);
  });

  it("calls emails.send with correct to and from fields", async () => {
    const { sendRegistrationEmail } = await import("@/lib/email");
    await sendRegistrationEmail(baseRegistrationParams);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.to).toEqual(["guest@example.com"]);
    expect(callArgs.from).toBe(process.env.EMAIL_FROM || "PMCC 4th Watch <events@pmcc4thwatch.us>");
  });

  it("default subject includes eventTitle", async () => {
    const { sendRegistrationEmail } = await import("@/lib/email");
    await sendRegistrationEmail(baseRegistrationParams);

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.subject).toBe("Your Registration for Summer Crusade 2026");
  });

  it("custom subject overrides default", async () => {
    const { sendRegistrationEmail } = await import("@/lib/email");
    await sendRegistrationEmail({
      ...baseRegistrationParams,
      subject: "Custom Subject Line",
    });

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.subject).toBe("Custom Subject Line");
  });

  it("custom HTML is used when provided", async () => {
    const { sendRegistrationEmail } = await import("@/lib/email");
    const customHtml = "<p>Custom content</p>";
    await sendRegistrationEmail({
      ...baseRegistrationParams,
      customHtml,
    });

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.html).toBe("<p>Custom content</p>");
  });

  it("generated HTML includes guestName", async () => {
    const { sendRegistrationEmail } = await import("@/lib/email");
    await sendRegistrationEmail(baseRegistrationParams);

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.html).toContain("Jane Guest");
  });

  it("generated HTML includes registrationCode", async () => {
    const { sendRegistrationEmail } = await import("@/lib/email");
    await sendRegistrationEmail(baseRegistrationParams);

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.html).toContain("REGCODE1");
  });

  it("generated HTML includes invitedByName when provided", async () => {
    const { sendRegistrationEmail } = await import("@/lib/email");
    await sendRegistrationEmail({
      ...baseRegistrationParams,
      invitedByName: "John Member",
      invitedByPhone: "+15551002000",
    });

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.html).toContain("John Member");
  });
});

// ---------------------------------------------------------------------------
// sendReminderEmail
// ---------------------------------------------------------------------------

describe("sendReminderEmail", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockSend.mockResolvedValue({ data: { id: "email-123" }, error: null });
  });

  it("returns success on send", async () => {
    const { sendReminderEmail } = await import("@/lib/email");
    const result = await sendReminderEmail(baseReminderParams);
    expect(result.success).toBe(true);
  });

  it('has correct subject for "day-before" reminder', async () => {
    const { sendReminderEmail } = await import("@/lib/email");
    await sendReminderEmail({ ...baseReminderParams, reminderType: "day-before" });

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.subject).toBe("Reminder: Summer Crusade 2026 is Tomorrow!");
  });

  it('has correct subject for "hour-before" reminder', async () => {
    const { sendReminderEmail } = await import("@/lib/email");
    await sendReminderEmail({ ...baseReminderParams, reminderType: "hour-before" });

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.subject).toBe("Starting Soon: Summer Crusade 2026 begins in 1 hour!");
  });

  it("reminder HTML includes guestName", async () => {
    const { sendReminderEmail } = await import("@/lib/email");
    await sendReminderEmail(baseReminderParams);

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.html).toContain("Jane Guest");
  });
});
