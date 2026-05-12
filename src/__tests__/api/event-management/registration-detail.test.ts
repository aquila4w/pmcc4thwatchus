import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import { mockSuperAdmin, mockMember, mockRegistration } from "../../helpers/fixtures";

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

import { GET, PATCH, DELETE } from "@/app/api/managed-events/[eventId]/registrations/[registrationId]/route";

describe("GET /api/managed-events/[eventId]/registrations/[registrationId]", () => {
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
            invitedBy: {
              id: "member-1",
              name: "John Member",
              phone: "+15551002000",
              email: "john@example.com",
              church: { id: "church-1", name: "PMCC LA Church" },
            },
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("returns registration with full guestInfo (PII) at depth 2", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
    });
    const response = await GET(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("reg-1");
    expect(data.guestInfo).toBeDefined();
    expect(data.guestInfo.email).toBe("jane@example.com");
    expect(data.guestInfo.phone).toBe("+15551003000");
    expect(data.guestInfo.name).toBe("Jane Guest");
    expect(data.guestInfo.firstName).toBe("Jane");
    expect(data.guestInfo.lastName).toBe("Guest");

    // Verify depth 2 is used
    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "event-registrations", id: "reg-1", depth: 2 })
    );
  });

  it("returns invitedBy with full member PII at depth 2", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
    });
    const response = await GET(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invitedBy).toBeDefined();
    expect(data.invitedBy.name).toBe("John Member");
    expect(data.invitedBy.phone).toBe("+15551002000");
    expect(data.invitedBy.email).toBe("john@example.com");
    expect(data.invitedBy.church).toBeDefined();
    expect(data.invitedBy.church.name).toBe("PMCC LA Church");
  });

  it("returns 500 when registration is not found", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/nonexistent",
    });
    const response = await GET(
      request,
      buildParams({ eventId: "event-1", registrationId: "nonexistent" })
    );

    expect(response.status).toBe(500);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
    });
    const response = await GET(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
    });
    const response = await GET(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    expect(response.status).toBe(403);
  });
});

describe("PATCH /api/managed-events/[eventId]/registrations/[registrationId]", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "event-registrations": [
          { ...mockRegistration, id: "reg-1", event: "event-1" },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("updates only allowed fields", async () => {
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
      body: {
        status: "attended",
        notes: "Checked in successfully",
        guestInfo: { name: "Updated Name" },
      },
    });
    const response = await PATCH(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    expect(response.status).toBe(200);
    const updateCall = payload.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe("attended");
    expect(updateCall.data.notes).toBe("Checked in successfully");
    expect(updateCall.data.guestInfo).toEqual({ name: "Updated Name" });
  });

  it("ignores disallowed fields (mass assignment protection)", async () => {
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
      body: {
        status: "attended",
        event: "different-event",
        guest: "different-guest",
        inviteCode: "HACKED",
      },
    });
    await PATCH(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    const updateCall = payload.update.mock.calls[0][0];
    expect(updateCall.data).toHaveProperty("status", "attended");
    expect(updateCall.data).not.toHaveProperty("event");
    expect(updateCall.data).not.toHaveProperty("guest");
    expect(updateCall.data).not.toHaveProperty("inviteCode");
  });

  it("auto-sets attendedAt when status is attended and no timestamp provided", async () => {
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
      body: { status: "attended" },
    });
    const response = await PATCH(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    expect(response.status).toBe(200);
    const updateCall = payload.update.mock.calls[0][0];
    expect(updateCall.data.attendedAt).toBeDefined();
    // Should be a valid ISO date string
    expect(new Date(updateCall.data.attendedAt).toISOString()).toBe(updateCall.data.attendedAt);
  });

  it("auto-sets baptizedAt when status is baptized and no timestamp provided", async () => {
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
      body: { status: "baptized" },
    });
    const response = await PATCH(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    expect(response.status).toBe(200);
    const updateCall = payload.update.mock.calls[0][0];
    expect(updateCall.data.baptizedAt).toBeDefined();
    expect(new Date(updateCall.data.baptizedAt).toISOString()).toBe(updateCall.data.baptizedAt);
  });

  it("does not overwrite attendedAt if explicitly provided", async () => {
    const explicitTime = "2026-07-15T08:00:00.000Z";
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
      body: { status: "attended", attendedAt: explicitTime },
    });
    await PATCH(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    const updateCall = payload.update.mock.calls[0][0];
    expect(updateCall.data.attendedAt).toBe(explicitTime);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
      body: { status: "attended" },
    });
    const response = await PATCH(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
      body: { status: "attended" },
    });
    const response = await PATCH(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    expect(response.status).toBe(403);
  });

  it("returns 500 on internal error", async () => {
    payload.update.mockRejectedValueOnce(new Error("DB error"));
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
      body: { status: "attended" },
    });
    const response = await PATCH(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/managed-events/[eventId]/registrations/[registrationId]", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "event-registrations": [
          { ...mockRegistration, id: "reg-1", event: "event-1" },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("deletes a registration", async () => {
    const request = buildRequest({
      method: "DELETE",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
    });
    const response = await DELETE(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(payload.delete).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "event-registrations", id: "reg-1" })
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({
      method: "DELETE",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
    });
    const response = await DELETE(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);
    const request = buildRequest({
      method: "DELETE",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
    });
    const response = await DELETE(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    expect(response.status).toBe(403);
  });

  it("returns 500 on internal error", async () => {
    payload.delete.mockRejectedValueOnce(new Error("DB error"));
    const request = buildRequest({
      method: "DELETE",
      url: "http://localhost:3000/api/managed-events/event-1/registrations/reg-1",
    });
    const response = await DELETE(
      request,
      buildParams({ eventId: "event-1", registrationId: "reg-1" })
    );

    expect(response.status).toBe(500);
  });
});
