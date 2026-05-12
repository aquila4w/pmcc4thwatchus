import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { mockGetPayload } from "../../helpers/mock-auth";
import { buildRequest } from "../../helpers/mock-request";
import { mockEvent } from "../../helpers/fixtures";

// Setup module-level mocks
vi.mock("payload", () => ({
  getPayload: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@payload-config", () => ({
  default: {},
}));

// Mock email and SMS modules used by the reminders route
vi.mock("@/lib/email", () => ({
  sendReminderEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/sms", () => ({
  sendRegistrationSMS: vi.fn().mockResolvedValue({ success: true }),
  shortenUrl: vi.fn().mockResolvedValue("https://short.url/abc123"),
}));

// Import handlers AFTER mocks are set up
import { GET, POST } from "@/app/api/cron/reminders/route";

describe("CRON /api/cron/reminders", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";

    const mock = createMockPayload({
      stores: {
        "managed-events": [],
        "event-registrations": [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
  });

  afterEach(() => {
    if (originalCronSecret !== undefined) {
      process.env.CRON_SECRET = originalCronSecret;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  it("returns 401 when CRON_SECRET is missing", async () => {
    const request = buildRequest({ method: "POST", url: "http://localhost:3000/api/cron/reminders" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 when wrong CRON_SECRET provided", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/reminders",
      headers: { Authorization: "Bearer wrong-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 via GET when CRON_SECRET is missing", async () => {
    const request = buildRequest({ method: "GET", url: "http://localhost:3000/api/cron/reminders" });
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("processes hour-before reminders for events starting within 1 hour", async () => {
    const now = new Date();
    // Event starting 30 minutes from now (within 1-hour window)
    const eventStart = new Date(now.getTime() + 30 * 60 * 1000);

    const mock = createMockPayload({
      stores: {
        "managed-events": [
          {
            ...mockEvent,
            id: "event-hour",
            title: "Hour-Before Event",
            startDate: eventStart.toISOString(),
            status: "registration-open",
          },
        ],
        "event-registrations": [
          {
            id: "reg-hour-1",
            inviteCode: "REGHOUR1",
            event: "event-hour",
            status: "registered",
            reminderHourBeforeSent: false,
            reminderDayBeforeSent: false,
            guestInfo: {
              name: "Test Guest",
              email: "guest@example.com",
              phone: "+15551009999",
            },
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/reminders",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.hourBeforeCount).toBe(1);
    // The day-before window should not match this event (30 min from now is not 25 hours from now)
    expect(data.dayBeforeCount).toBe(0);

    // Verify reminder flag was updated
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "event-registrations",
        id: "reg-hour-1",
        data: expect.objectContaining({ reminderHourBeforeSent: true }),
      })
    );
  });

  it("processes day-before reminders for events starting in ~25 hours", async () => {
    const now = new Date();
    // Event starting 25.5 hours from now (within 25-26 hour window)
    const eventStart = new Date(now.getTime() + 25.5 * 60 * 60 * 1000);

    const mock = createMockPayload({
      stores: {
        "managed-events": [
          {
            ...mockEvent,
            id: "event-day",
            title: "Day-Before Event",
            startDate: eventStart.toISOString(),
            status: "registration-open",
          },
        ],
        "event-registrations": [
          {
            id: "reg-day-1",
            inviteCode: "REGDAY1",
            event: "event-day",
            status: "registered",
            reminderHourBeforeSent: false,
            reminderDayBeforeSent: false,
            guestInfo: {
              name: "Day Guest",
              email: "dayguest@example.com",
              phone: "+15551008888",
            },
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/reminders",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // The hour-before window should not match this event (25.5 hours from now is not within 1 hour)
    expect(data.hourBeforeCount).toBe(0);
    expect(data.dayBeforeCount).toBe(1);

    // Verify reminder flag was updated
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "event-registrations",
        id: "reg-day-1",
        data: expect.objectContaining({ reminderDayBeforeSent: true }),
      })
    );
  });

  it("skips registrations that already received the reminder", async () => {
    const now = new Date();
    const eventStart = new Date(now.getTime() + 30 * 60 * 1000);

    const mock = createMockPayload({
      stores: {
        "managed-events": [
          {
            ...mockEvent,
            id: "event-skip",
            title: "Skip Reminder Event",
            startDate: eventStart.toISOString(),
            status: "registration-open",
          },
        ],
        "event-registrations": [
          {
            id: "reg-skip-1",
            inviteCode: "REGSKIP1",
            event: "event-skip",
            status: "registered",
            reminderHourBeforeSent: true, // Already sent
            reminderDayBeforeSent: false,
            guestInfo: {
              name: "Already Reminded",
              email: "reminded@example.com",
              phone: "+15551007777",
            },
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/reminders",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // The event was found, but no unsent registrations matched
    expect(data.hourBeforeCount).toBe(1);
  });

  it("returns 500 on internal error", async () => {
    payload.find.mockRejectedValueOnce(new Error("DB down"));

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/reminders",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });

  it("returns 0 counts when no events in reminder windows", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/cron/reminders",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.hourBeforeCount).toBe(0);
    expect(data.dayBeforeCount).toBe(0);
  });
});
