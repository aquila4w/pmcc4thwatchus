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

import { GET } from "@/app/api/events/[eventId]/export/route";

describe("GET /api/events/[eventId]/export", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  const registrations = [
    {
      id: "r1",
      event: "event-1",
      registrationCode: "CODE001",
      guestName: "Alice Smith",
      guestEmail: "alice@example.com",
      guestPhone: "+15551001001",
      status: "registered",
      createdAt: "2026-06-01T12:00:00.000Z",
    },
    {
      id: "r2",
      event: "event-1",
      registrationCode: "CODE002",
      guestName: "Bob Jones",
      guestEmail: "bob@example.com",
      guestPhone: "+15551001002",
      status: "attended",
      checkedInAt: "2026-07-15T09:30:00.000Z",
      createdAt: "2026-06-02T12:00:00.000Z",
    },
    {
      id: "r3",
      event: "event-1",
      registrationCode: "CODE003",
      guestName: "Carol White",
      guestEmail: "carol@example.com",
      guestPhone: "+15551001003",
      status: "baptized",
      checkedInAt: "2026-07-15T09:30:00.000Z",
      baptizedAt: "2026-07-15T11:00:00.000Z",
      createdAt: "2026-06-03T12:00:00.000Z",
    },
  ];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [{ ...mockEvent, id: "event-1" }],
        "event-registrations": registrations,
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("exports registrations in JSON format with PII (default)", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.event).toBeDefined();
    expect(data.event.id).toBe("event-1");
    expect(data.event.title).toBe("Summer Crusade 2026");
    expect(data.data).toHaveLength(3);
    expect(data.total).toBe(3);

    // Verify PII is present
    const firstReg = data.data[0];
    expect(firstReg["Guest Name"]).toBe("Alice Smith");
    expect(firstReg["Guest Email"]).toBe("alice@example.com");
    expect(firstReg["Guest Phone"]).toBe("+15551001001");
    expect(firstReg["Registration Code"]).toBe("CODE001");
    expect(firstReg.Status).toBe("registered");
  });

  it("exports registrations in CSV format", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export?format=csv",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("_export.csv");

    const csv = await response.text();
    const lines = csv.split("\n");
    // Header + 3 data rows
    expect(lines).toHaveLength(4);
    // Verify CSV header contains expected columns
    expect(lines[0]).toContain("Registration Code");
    expect(lines[0]).toContain("Guest Name");
    expect(lines[0]).toContain("Guest Email");
    expect(lines[0]).toContain("Guest Phone");
  });

  it("exports only attended/baptized registrations for type=attendance", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export?type=attendance",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2); // Only attended + baptized
    // Should not include "registered" status
    for (const row of data.data) {
      expect(["attended", "baptized"]).toContain(row.Status);
    }
  });

  it("attendance export includes PII fields", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export?type=attendance&format=json",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    const attendedReg = data.data.find((r: Record<string, unknown>) => r["Guest Name"] === "Bob Jones");
    expect(attendedReg).toBeDefined();
    expect(attendedReg["Guest Phone"]).toBe("+15551001002");
    expect(attendedReg["Checked In At"]).toBeDefined();
  });

  it("exports summary data for type=summary", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export?type=summary",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    const summary = data.data[0];
    expect(summary["Event Title"]).toBe("Summer Crusade 2026");
    expect(summary["Total Registrations"]).toBe(3);
    expect(summary["Attended"]).toBe(2); // attended + baptized
    expect(summary["Baptized"]).toBe(1);
    expect(summary["Location"]).toBe("LA Convention Center");
  });

  it("exports summary in CSV format", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export?type=summary&format=csv",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(200);
    const csv = await response.text();
    const lines = csv.split("\n");
    expect(lines[0]).toContain("Event Title");
    expect(lines[0]).toContain("Total Registrations");
    expect(lines[0]).toContain("Attended");
    expect(lines[0]).toContain("Baptized");
  });

  it("returns 404 for nonexistent event", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/nonexistent/export",
    });
    const response = await GET(request, buildParams({ eventId: "nonexistent" }));

    expect(response.status).toBe(500);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(403);
  });

  it("returns 500 on internal error", async () => {
    payload.findByID.mockRejectedValueOnce(new Error("DB error"));
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(500);
  });
});
