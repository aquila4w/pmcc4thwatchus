import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockRegistration,
} from "../../helpers/fixtures";

// Setup module mocks at top level
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

// Mock email module (sendReminderEmail is exported from same file)
vi.mock("@/lib/email", () => ({
  sendRegistrationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendReminderEmail: vi.fn().mockResolvedValue({ success: true }),
}));

import { POST } from "@/app/api/reminders/send/route";
import { sendReminderEmail } from "@/lib/email";

describe("POST /api/reminders/send", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper: create an event with startDate offset from "now" by hours
  function createEventWithOffset(id: string, hoursFromNow: number, status = "registration-open") {
    const startDate = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
    return {
      id,
      title: `Event ${id}`,
      slug: `event-${id}`,
      startDate,
      location: "LA Convention Center",
      status,
    };
  }

  // Helper: create a registration with guestInfo for reminder emails
  function createRegistrationForReminder(
    eventId: string,
    email: string,
    name: string,
    reminderFlags: { reminderDayBeforeSent?: boolean; reminderHourBeforeSent?: boolean } = {}
  ) {
    return {
      id: `reg-reminder-${email}`,
      inviteCode: `CODE-${email}`,
      event: eventId,
      status: "registered",
      guestInfo: {
        name,
        email,
        phone: "+15551009999",
      },
      reminderDayBeforeSent: reminderFlags.reminderDayBeforeSent ?? false,
      reminderHourBeforeSent: reminderFlags.reminderHourBeforeSent ?? false,
    };
  }

  // 1. Sends day-before reminders for events ~24h away
  it("sends day-before reminders for events approximately 24h away", async () => {
    // Event starting in ~24 hours (within 23-25h window)
    const dayBeforeEvent = createEventWithOffset("event-day", 24);
    const reg = createRegistrationForReminder("event-day", "guest@example.com", "Guest User");

    const mock = createMockPayload({
      stores: {
        "managed-events": [dayBeforeEvent],
        "event-registrations": [reg],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/reminders/send",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.dayBefore).toBeGreaterThan(0);

    expect(sendReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "guest@example.com",
        guestName: "Guest User",
        reminderType: "day-before",
      })
    );
  });

  // 2. Sends hour-before reminders for events ~1h away
  it("sends hour-before reminders for events approximately 1h away", async () => {
    // Event starting in ~1.5 hours (within 1-2h window)
    const hourBeforeEvent = createEventWithOffset("event-hour", 1.5);
    const reg = createRegistrationForReminder("event-hour", "guest2@example.com", "Hour Guest");

    const mock = createMockPayload({
      stores: {
        "managed-events": [hourBeforeEvent],
        "event-registrations": [reg],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/reminders/send",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.hourBefore).toBeGreaterThan(0);

    expect(sendReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "guest2@example.com",
        guestName: "Hour Guest",
        reminderType: "hour-before",
      })
    );
  });

  // 3. Updates reminder sent flags
  it("updates reminder sent flags on registrations after sending", async () => {
    const dayBeforeEvent = createEventWithOffset("event-flags", 24);
    const reg = createRegistrationForReminder("event-flags", "flags@example.com", "Flags User");

    const mock = createMockPayload({
      stores: {
        "managed-events": [dayBeforeEvent],
        "event-registrations": [reg],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/reminders/send",
    });

    await POST(request);

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "event-registrations",
        id: reg.id,
        data: expect.objectContaining({
          reminderDayBeforeSent: true,
        }),
      })
    );
  });

  // 4. Returns 401/403 for unauthorized
  it("returns 401 when not authenticated", async () => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [],
        "event-registrations": [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/reminders/send",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Authentication required");
  });

  it("returns 403 when user is not admin", async () => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [],
        "event-registrations": [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/reminders/send",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Insufficient permissions");
  });
});
