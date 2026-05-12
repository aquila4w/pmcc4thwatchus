import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { buildRequest } from "../../helpers/mock-request";
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

import { GET, POST } from "@/app/api/managed-events/route";

describe("GET /api/managed-events", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [
          {
            ...mockEvent,
            id: "event-1",
            adminNotes: "Internal planning notes",
          },
          {
            ...mockEvent,
            id: "event-2",
            title: "Winter Retreat 2026",
            slug: "winter-retreat-2026",
            description: "Annual winter retreat",
            location: "Mountain Resort",
            status: "draft",
            adminNotes: "Draft notes",
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
  });

  it("returns a list of events", async () => {
    const request = buildRequest({ method: "GET", url: "http://localhost:3000/api/managed-events" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.docs).toHaveLength(2);
    expect(data.totalDocs).toBe(2);
    expect(data.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("strips adminNotes from response", async () => {
    const request = buildRequest({ method: "GET", url: "http://localhost:3000/api/managed-events" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    for (const doc of data.docs) {
      expect(doc).not.toHaveProperty("adminNotes");
    }
  });

  it("filters events by status", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events?status=draft",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.docs).toHaveLength(1);
    expect(data.docs[0].status).toBe("draft");
  });

  it("supports search filter across title, location, and description", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events?search=Summer",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.docs).toHaveLength(1);
    expect(data.docs[0].title).toContain("Summer");
  });

  it("returns empty array when no events match filter", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/managed-events?status=completed",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.docs).toHaveLength(0);
    expect(data.totalDocs).toBe(0);
  });

  it("returns events without requiring authentication (public)", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({ method: "GET", url: "http://localhost:3000/api/managed-events" });
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it("returns 500 on internal error", async () => {
    payload.find.mockRejectedValueOnce(new Error("DB down"));
    const request = buildRequest({ method: "GET", url: "http://localhost:3000/api/managed-events" });
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});

describe("POST /api/managed-events", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({ stores: { "managed-events": [] } });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("creates a new event and returns 201", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/managed-events",
      body: {
        title: "Spring Revival 2026",
        description: "Annual revival event",
        location: "San Diego Convention Center",
        startDate: "2026-04-01T10:00:00.000Z",
        endDate: "2026-04-01T18:00:00.000Z",
        maxAttendees: 300,
      },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe("Spring Revival 2026");
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "managed-events",
      })
    );
  });

  it("auto-generates slug from title", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/managed-events",
      body: { title: "Summer Crusade 2026" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.slug).toBe("summer-crusade-2026");
  });

  it("auto-generates slug that lowercases and hyphenates", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/managed-events",
      body: { title: "My Awesome Event!!! Here  " },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.slug).toBe("my-awesome-event-here");
  });

  it("uses provided slug if no title", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/managed-events",
      body: { slug: "custom-slug" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(payload.create).toHaveBeenCalled();
  });

  it("only allows whitelisted fields (ignores adminNotes)", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/managed-events",
      body: {
        title: "Test Event",
        adminNotes: "Should not be saved",
        maliciousField: "hacked",
      },
    });
    await POST(request);

    const createCall = payload.create.mock.calls[0][0];
    expect(createCall.data).not.toHaveProperty("adminNotes");
    expect(createCall.data).not.toHaveProperty("maliciousField");
    expect(createCall.data.title).toBe("Test Event");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/managed-events",
      body: { title: "Unauthorized Event" },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/managed-events",
      body: { title: "Forbidden Event" },
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it("returns 500 on internal error", async () => {
    payload.create.mockRejectedValueOnce(new Error("DB error"));
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/managed-events",
      body: { title: "Failing Event" },
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
