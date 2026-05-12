import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockHeadMinister,
  mockSecretary,
  mockEventAdmin,
  mockDistrictCoordinator,
  mockSubDistrictCoordinator,
  mockEvent,
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

import { GET, PATCH, DELETE } from "@/app/api/managed-events/[eventId]/route";

describe("GET /api/managed-events/[eventId]", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [
          { ...mockEvent, id: "event-1", adminNotes: "secret notes" },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
  });

  it("returns event details at depth 2", async () => {
    const request = buildRequest({ method: "GET", url: "http://localhost:3000/api/managed-events/event-1" });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("event-1");
    expect(data.title).toBe("Summer Crusade 2026");
    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "managed-events", id: "event-1", depth: 2 })
    );
  });

  it("includes adminNotes in full detail (unlike list endpoint)", async () => {
    const request = buildRequest({ method: "GET", url: "http://localhost:3000/api/managed-events/event-1" });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("adminNotes");
    expect(data.adminNotes).toBe("secret notes");
  });

  it("works without authentication (public)", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({ method: "GET", url: "http://localhost:3000/api/managed-events/event-1" });
    const response = await GET(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(200);
  });

  it("returns 500 when event is not found", async () => {
    const request = buildRequest({ method: "GET", url: "http://localhost:3000/api/managed-events/nonexistent" });
    const response = await GET(request, buildParams({ eventId: "nonexistent" }));

    expect(response.status).toBe(500);
  });
});

describe("PATCH /api/managed-events/[eventId]", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [{ ...mockEvent, id: "event-1" }],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("updates an event and returns updated data", async () => {
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1",
      body: { title: "Updated Crusade", location: "New Venue" },
    });
    const response = await PATCH(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "managed-events",
        id: "event-1",
        depth: 2,
        overrideAccess: true,
      })
    );
  });

  it("auto-generates slug from title when title is provided", async () => {
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1",
      body: { title: "New Event Title" },
    });
    await PATCH(request, buildParams({ eventId: "event-1" }));

    const updateCall = payload.update.mock.calls[0][0];
    expect(updateCall.data.slug).toBe("new-event-title");
  });

  it("only allows whitelisted fields (ignores adminNotes)", async () => {
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1",
      body: {
        title: "Updated",
        adminNotes: "should be ignored",
        maliciousField: "hacked",
      },
    });
    await PATCH(request, buildParams({ eventId: "event-1" }));

    const updateCall = payload.update.mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty("adminNotes");
    expect(updateCall.data).not.toHaveProperty("maliciousField");
    expect(updateCall.data.title).toBe("Updated");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1",
      body: { title: "Updated" },
    });
    const response = await PATCH(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1",
      body: { title: "Updated" },
    });
    const response = await PATCH(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(403);
  });

  it("returns 500 on internal error", async () => {
    payload.update.mockRejectedValueOnce(new Error("DB error"));
    const request = buildRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/managed-events/event-1",
      body: { title: "Updated" },
    });
    const response = await PATCH(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/managed-events/[eventId]", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [{ ...mockEvent, id: "event-1" }],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
  });

  it("deletes event for superAdmin", async () => {
    mockAuthenticatedUser(mockSuperAdmin);
    const request = buildRequest({ method: "DELETE", url: "http://localhost:3000/api/managed-events/event-1" });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(payload.delete).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "managed-events", id: "event-1" })
    );
  });

  it("deletes event for districtCoordinator", async () => {
    mockAuthenticatedUser(mockDistrictCoordinator);
    const request = buildRequest({ method: "DELETE", url: "http://localhost:3000/api/managed-events/event-1" });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(200);
  });

  it("deletes event for subDistrictCoordinator", async () => {
    mockAuthenticatedUser(mockSubDistrictCoordinator);
    const request = buildRequest({ method: "DELETE", url: "http://localhost:3000/api/managed-events/event-1" });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(200);
  });

  it("deletes event for eventAdmin", async () => {
    mockAuthenticatedUser(mockEventAdmin);
    const request = buildRequest({ method: "DELETE", url: "http://localhost:3000/api/managed-events/event-1" });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(200);
  });

  it("returns 403 for headMinister (not elevated role)", async () => {
    mockAuthenticatedUser(mockHeadMinister);
    const request = buildRequest({ method: "DELETE", url: "http://localhost:3000/api/managed-events/event-1" });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(403);
  });

  it("returns 403 for secretary (not elevated role)", async () => {
    mockAuthenticatedUser(mockSecretary);
    const request = buildRequest({ method: "DELETE", url: "http://localhost:3000/api/managed-events/event-1" });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({ method: "DELETE", url: "http://localhost:3000/api/managed-events/event-1" });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(401);
  });

  it("returns 500 on internal error", async () => {
    mockAuthenticatedUser(mockSuperAdmin);
    payload.delete.mockRejectedValueOnce(new Error("DB error"));
    const request = buildRequest({ method: "DELETE", url: "http://localhost:3000/api/managed-events/event-1" });
    const response = await DELETE(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(500);
  });
});
