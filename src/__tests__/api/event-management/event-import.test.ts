import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import { mockSuperAdmin, mockMember, mockEvent } from "../../helpers/fixtures";

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

import { POST } from "@/app/api/events/[eventId]/import/route";

describe("POST /api/events/[eventId]/import", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [{ ...mockEvent, id: "event-1" }],
        "event-registrations": [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("creates new registrations from import data", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/import",
      body: {
        registrations: [
          {
            registrationCode: "IMP001",
            guestName: "Alice Import",
            guestEmail: "alice@import.com",
            guestPhone: "+15559999001",
            status: "registered",
          },
          {
            registrationCode: "IMP002",
            guestName: "Bob Import",
            guestEmail: "bob@import.com",
            status: "registered",
          },
        ],
      },
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.created).toBe(2);
    expect(data.updated).toBe(0);
    expect(payload.create).toHaveBeenCalledTimes(2);
  });

  it("updates existing registrations when registrationCode matches", async () => {
    // Setup: pre-existing registration with code IMP001
    const mock = createMockPayload({
      stores: {
        "managed-events": [{ ...mockEvent, id: "event-1" }],
        "event-registrations": [
          {
            id: "existing-1",
            event: "event-1",
            registrationCode: "IMP001",
            guestName: "Old Name",
            status: "registered",
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/import",
      body: {
        registrations: [
          {
            registrationCode: "IMP001",
            guestName: "Updated Name",
            guestEmail: "updated@import.com",
            status: "attended",
          },
        ],
      },
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.updated).toBe(1);
    expect(data.created).toBe(0);
    expect(payload.update).toHaveBeenCalledTimes(1);
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "event-registrations",
        id: "existing-1",
      })
    );
  });

  it("handles mix of new and existing registrations", async () => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [{ ...mockEvent, id: "event-1" }],
        "event-registrations": [
          {
            id: "existing-1",
            event: "event-1",
            registrationCode: "EXIST01",
            guestName: "Existing Person",
            status: "registered",
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/import",
      body: {
        registrations: [
          {
            registrationCode: "EXIST01",
            guestName: "Updated Person",
            status: "attended",
          },
          {
            registrationCode: "NEW01",
            guestName: "Brand New Person",
            status: "registered",
          },
        ],
      },
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.updated).toBe(1);
    expect(data.created).toBe(1);
    expect(payload.update).toHaveBeenCalledTimes(1);
    expect(payload.create).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when registrations is not an array", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/import",
      body: { registrations: "not-an-array" },
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when registrations is missing", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/import",
      body: {},
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(400);
  });

  it("returns 404 for nonexistent event", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/nonexistent/import",
      body: {
        registrations: [
          { registrationCode: "IMP001", guestName: "Test" },
        ],
      },
    });
    const response = await POST(request, buildParams({ eventId: "nonexistent" }));

    expect(response.status).toBe(500);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/import",
      body: {
        registrations: [
          { registrationCode: "IMP001", guestName: "Test" },
        ],
      },
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/import",
      body: {
        registrations: [
          { registrationCode: "IMP001", guestName: "Test" },
        ],
      },
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(403);
  });

  it("collects errors for individual failed imports", async () => {
    // Make create fail for one registration
    payload.create.mockRejectedValueOnce(new Error("Duplicate code"));

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/import",
      body: {
        registrations: [
          { registrationCode: "FAIL01", guestName: "Fail Person" },
          { registrationCode: "OK01", guestName: "OK Person" },
        ],
      },
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.created).toBe(1);
    expect(data.errors).toBeDefined();
    expect(data.errors.length).toBeGreaterThanOrEqual(1);
    expect(data.errors[0]).toContain("Fail Person");
  });

  it("returns 500 on general internal error", async () => {
    payload.findByID.mockRejectedValueOnce(new Error("DB error"));
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/import",
      body: {
        registrations: [
          { registrationCode: "IMP001", guestName: "Test" },
        ],
      },
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(500);
  });
});
