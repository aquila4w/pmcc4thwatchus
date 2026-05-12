import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockRegistration,
  mockAttendedRegistration,
  mockWaitlistedRegistration,
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

import { GET, PATCH, DELETE } from "@/app/api/managed-events/[eventId]/registrations/route";

describe("GET /api/managed-events/[eventId]/registrations", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "event-registrations": [
          {
            ...mockRegistration,
            id: "reg-1",
            event: "event-1",
            guestInfo: {
              firstName: "Jane",
              lastName: "Guest",
              name: "Jane Guest",
              email: "jane@example.com",
              phone: "+15551003000",
            },
          },
          {
            ...mockAttendedRegistration,
            id: "reg-2",
            event: "event-1",
            status: "attended",
          },
          {
            ...mockWaitlistedRegistration,
            id: "reg-4",
            event: "event-1",
            status: "waitlisted",
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("returns registrations for an event with guestInfo (PII)", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events/event-1/registrations",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.docs.length).toBeGreaterThanOrEqual(1);
    expect(data.totalDocs).toBeGreaterThanOrEqual(1);

    // Verify PII is present in guestInfo
    const regWithGuestInfo = data.docs.find((d: Record<string, unknown>) => d.id === "reg-1");
    expect(regWithGuestInfo).toBeDefined();
    expect(regWithGuestInfo.guestInfo).toBeDefined();
    expect(regWithGuestInfo.guestInfo.email).toBe("jane@example.com");
    expect(regWithGuestInfo.guestInfo.phone).toBe("+15551003000");
    expect(regWithGuestInfo.guestInfo.name).toBe("Jane Guest");
  });

  it("filters registrations by status", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events/event-1/registrations?status=attended",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.docs).toHaveLength(1);
    expect(data.docs[0].status).toBe("attended");
  });

  it("supports search filter across guest info fields", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events/event-1/registrations?search=Jane",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.docs.length).toBeGreaterThanOrEqual(1);
  });

  it("returns pagination metadata", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events/event-1/registrations",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("docs");
    expect(data).toHaveProperty("totalDocs");
    expect(data).toHaveProperty("totalPages");
    expect(data).toHaveProperty("page");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events/event-1/registrations",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events/event-1/registrations",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(403);
  });
});

describe("PATCH /api/managed-events/[eventId]/registrations (bulk update)", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "event-registrations": [
          { ...mockRegistration, id: "reg-1", event: "event-1" },
          { ...mockAttendedRegistration, id: "reg-2", event: "event-1" },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("bulk updates registration statuses", async () => {
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations",
      body: {
        registrationIds: ["reg-1", "reg-2"],
        status: "attended",
      },
    });
    const response = await PATCH(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.updated).toBe(2);
    expect(payload.update).toHaveBeenCalledTimes(2);
  });

  it("bulk updates with notes", async () => {
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations",
      body: {
        registrationIds: ["reg-1"],
        status: "attended",
        notes: "Checked in at front desk",
      },
    });
    const response = await PATCH(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.updated).toBe(1);

    const updateCall = payload.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe("attended");
    expect(updateCall.data.notes).toBe("Checked in at front desk");
  });

  it("returns 400 when registrationIds is missing", async () => {
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations",
      body: { status: "attended" },
    });
    const response = await PATCH(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when registrationIds is not an array", async () => {
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations",
      body: { registrationIds: "not-array", status: "attended" },
    });
    const response = await PATCH(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when IDs do not belong to the event", async () => {
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations",
      body: {
        registrationIds: ["reg-1", "reg-nonexistent"],
        status: "attended",
      },
    });
    const response = await PATCH(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations",
      body: { registrationIds: ["reg-1"], status: "attended" },
    });
    const response = await PATCH(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations",
      body: { registrationIds: ["reg-1"], status: "attended" },
    });
    const response = await PATCH(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(403);
  });
});

describe("DELETE /api/managed-events/[eventId]/registrations (bulk delete)", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "event-registrations": [
          { ...mockRegistration, id: "reg-1", event: "event-1" },
          { ...mockAttendedRegistration, id: "reg-2", event: "event-1" },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("bulk deletes registrations by comma-separated ids", async () => {
    const request = buildRequest({
      method: "DELETE",
      url: "http://localhost:3000/api/managed-events/event-1/registrations?ids=reg-1,reg-2",
    });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deleted).toBe(2);
    expect(payload.delete).toHaveBeenCalledTimes(2);
  });

  it("bulk deletes a single registration", async () => {
    const request = buildRequest({
      method: "DELETE",
      url: "http://localhost:3000/api/managed-events/event-1/registrations?ids=reg-1",
    });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deleted).toBe(1);
  });

  it("returns 400 when ids parameter is missing", async () => {
    const request = buildRequest({
      method: "DELETE",
      url: "http://localhost:3000/api/managed-events/event-1/registrations",
    });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({
      method: "DELETE",
      url: "http://localhost:3000/api/managed-events/event-1/registrations?ids=reg-1",
    });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);
    const request = buildRequest({
      method: "DELETE",
      url: "http://localhost:3000/api/managed-events/event-1/registrations?ids=reg-1",
    });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(403);
  });
});
