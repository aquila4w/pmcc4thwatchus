import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockGetPayload } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockMember,
  mockChurch,
  mockEvent,
  mockRegistration,
} from "../../helpers/fixtures";

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

// Import after mocks are set up
import { GET } from "@/app/api/invite/[memberCode]/route";

describe("GET /api/invite/[memberCode]", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        users: [
          { ...mockMember, church: { id: "church-1", name: "PMCC LA Church" } },
        ],
        "managed-events": [mockEvent],
        "event-registrations": [mockRegistration],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
  });

  // 1. Returns member name and available events
  it("returns member name and available events", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/invite/MEMBR01A2",
    });
    const context = buildParams({ memberCode: "MEMBR01A2" });

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.member).toBeDefined();
    expect(data.member.name).toBe("John Member");
    expect(data.member.phone).toBe("+15551002000");
    expect(data.member.church).toBe("PMCC LA Church");

    expect(data.events).toBeDefined();
    expect(data.events.length).toBeGreaterThanOrEqual(1);

    const event = data.events[0];
    expect(event.title).toBe("Summer Crusade 2026");
    expect(event.slug).toBe("summer-crusade-2026");
    expect(event.id).toBe("event-1");
  });

  // 2. Returns 404 for invalid invite code
  it("returns 404 for invalid invite code", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/invite/INVALID01",
    });
    const context = buildParams({ memberCode: "INVALID01" });

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Invalid invite code");
  });

  // 3. Filters out events past registration deadline
  it("filters out events past registration deadline", async () => {
    const pastEvent = {
      ...mockEvent,
      id: "event-past",
      title: "Past Event",
      slug: "past-event",
      status: "registration-open",
      registrationEnabled: true,
      registrationDeadline: "2020-01-01T00:00:00.000Z",
      maxAttendees: 500,
    };
    const mock = createMockPayload({
      stores: {
        users: [
          { ...mockMember, church: { id: "church-1", name: "PMCC LA Church" } },
        ],
        "managed-events": [pastEvent],
        "event-registrations": [],
      },
    });
    mockGetPayload(mock.payload);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/invite/MEMBR01A2",
    });
    const context = buildParams({ memberCode: "MEMBR01A2" });

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.events).toHaveLength(0);
  });

  // 4. Filters out full events
  it("filters out full events", async () => {
    const fullEvent = {
      ...mockEvent,
      id: "event-full",
      title: "Full Event",
      slug: "full-event",
      status: "registration-open",
      registrationEnabled: true,
      maxAttendees: 1,
      registrationDeadline: "2027-12-31T23:59:59.000Z",
    };
    // Create enough registrations to fill the event
    const registrations = [
      { ...mockRegistration, id: "reg-a", event: "event-full", status: "registered" },
      { ...mockRegistration, id: "reg-b", event: "event-full", status: "attended" },
    ];

    const mock = createMockPayload({
      stores: {
        users: [
          { ...mockMember, church: { id: "church-1", name: "PMCC LA Church" } },
        ],
        "managed-events": [fullEvent],
        "event-registrations": registrations,
      },
    });
    mockGetPayload(mock.payload);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/invite/MEMBR01A2",
    });
    const context = buildParams({ memberCode: "MEMBR01A2" });

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.events).toHaveLength(0);
  });
});
