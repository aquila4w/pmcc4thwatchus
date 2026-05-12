import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { setupModuleMocks, mockAuthenticatedUser, mockGetPayload, mockGetPayloadError } from "../../helpers/mock-auth";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import { mockSuperAdmin, mockMember } from "../../helpers/fixtures";

// Setup module-level mocks
setupModuleMocks();

// Import handlers AFTER mocks are set up
import { GET, POST } from "@/app/api/events/[eventId]/stream/route";

describe("GET /api/events/[eventId]/stream", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
  });

  it("returns correct SSE headers (Content-Type: text/event-stream)", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/stream",
    });
    const context = buildParams({ eventId: "event-1" });

    const response = await GET(request, context);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
    expect(response.headers.get("Connection")).toBe("keep-alive");
  });

  it("returns a ReadableStream body", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/stream",
    });
    const context = buildParams({ eventId: "event-1" });

    const response = await GET(request, context);

    expect(response.body).not.toBeNull();
    expect(response.body).toBeInstanceOf(ReadableStream);
  });

  it("sends initial connection message via stream", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/stream",
    });
    const context = buildParams({ eventId: "event-1" });

    const response = await GET(request, context);
    const stream = response.body as ReadableStream;
    const reader = stream.getReader();

    // Read the first chunk (initial connection message)
    const { value, done } = await reader.read();
    expect(done).toBe(false);

    const text = new TextDecoder().decode(value);
    expect(text).toContain("data:");
    expect(text).toContain("connected");

    const parsed = JSON.parse(text.replace("data: ", "").trim());
    expect(parsed.type).toBe("connected");
    expect(parsed).toHaveProperty("timestamp");

    reader.releaseLock();
  });

  it("does not require authentication (public endpoint)", async () => {
    // No mockAuthenticatedUser call
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/stream",
    });
    const context = buildParams({ eventId: "event-1" });

    const response = await GET(request, context);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });
});

describe("POST /api/events/[eventId]/stream", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("broadcasts message with admin auth and returns acknowledgment", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/stream",
      body: {
        type: "registration-update",
        data: { registrationId: "reg-1", status: "checked-in" },
      },
    });
    const context = buildParams({ eventId: "event-1" });

    const response = await POST(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("acknowledged");
    expect(data.type).toBe("registration-update");
    expect(data.eventId).toBe("event-1");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/stream",
      body: { type: "test", data: {} },
    });
    const context = buildParams({ eventId: "event-1" });

    const response = await POST(request, context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain("Authentication required");
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/stream",
      body: { type: "test", data: {} },
    });
    const context = buildParams({ eventId: "event-1" });

    const response = await POST(request, context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("Insufficient permissions");
  });

  it("returns 500 on internal error", async () => {
    // Force getPayload to throw
    mockGetPayloadError("Internal failure");

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/stream",
      body: { type: "test", data: {} },
    });
    const context = buildParams({ eventId: "event-1" });

    const response = await POST(request, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
