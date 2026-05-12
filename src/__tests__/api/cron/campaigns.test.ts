import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { mockGetPayload } from "../../helpers/mock-auth";
import { buildRequest } from "../../helpers/mock-request";
import { mockCampaign } from "../../helpers/fixtures";

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

// Import handlers AFTER mocks are set up
import { GET, POST } from "@/app/api/cron/campaigns/route";

describe("CRON /api/cron/campaigns", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    // Set a known CRON_SECRET for tests
    process.env.CRON_SECRET = "test-cron-secret";

    const mock = createMockPayload({
      stores: {
        campaigns: [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    // Mock global.fetch for internal campaign send calls
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
  });

  afterEach(() => {
    // Restore original CRON_SECRET
    if (originalCronSecret !== undefined) {
      process.env.CRON_SECRET = originalCronSecret;
    } else {
      delete process.env.CRON_SECRET;
    }
    vi.restoreAllMocks();
  });

  it("returns 401 when CRON_SECRET is missing from request", async () => {
    const request = buildRequest({ method: "POST", url: "http://localhost:3000/api/cron/campaigns" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 when wrong CRON_SECRET provided", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/campaigns",
      headers: { Authorization: "Bearer wrong-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 via GET when CRON_SECRET is missing", async () => {
    const request = buildRequest({ method: "GET", url: "http://localhost:3000/api/cron/campaigns" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("processes scheduled campaigns and returns processedCount", async () => {
    const mock = createMockPayload({
      stores: {
        campaigns: [
          {
            ...mockCampaign,
            id: "campaign-1",
            status: "scheduled",
            scheduledAt: "2026-01-01T00:00:00.000Z", // in the past
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/campaigns",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.processedCount).toBe(1);
    expect(data.totalFound).toBe(1);

    // Verify fetch was called to trigger campaign send
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/campaigns/campaign-1/send"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("reschedules daily recurring campaigns that were sent 24+ hours ago", async () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const mock = createMockPayload({
      stores: {
        campaigns: [
          {
            ...mockCampaign,
            id: "campaign-daily",
            status: "sent",
            frequency: "daily",
            lastSentAt: twoDaysAgo.toISOString(),
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/campaigns",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify the campaign was rescheduled
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "campaigns",
        id: "campaign-daily",
        data: expect.objectContaining({ status: "scheduled" }),
      })
    );
  });

  it("reschedules weekly recurring campaigns that were sent 168+ hours ago", async () => {
    const now = new Date();
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    const mock = createMockPayload({
      stores: {
        campaigns: [
          {
            ...mockCampaign,
            id: "campaign-weekly",
            status: "sent",
            frequency: "weekly",
            lastSentAt: eightDaysAgo.toISOString(),
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/campaigns",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify the campaign was rescheduled
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "campaigns",
        id: "campaign-weekly",
        data: expect.objectContaining({ status: "scheduled" }),
      })
    );
  });

  it("does not reschedule recurring campaigns sent recently", async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

    const mock = createMockPayload({
      stores: {
        campaigns: [
          {
            ...mockCampaign,
            id: "campaign-recent",
            status: "sent",
            frequency: "daily",
            lastSentAt: oneHourAgo.toISOString(),
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/campaigns",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Should NOT have been rescheduled (sent only 1 hour ago, needs 24h)
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("skips recurring campaigns with no lastSentAt", async () => {
    const mock = createMockPayload({
      stores: {
        campaigns: [
          {
            ...mockCampaign,
            id: "campaign-no-date",
            status: "sent",
            frequency: "daily",
            lastSentAt: null,
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/campaigns",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("returns processedCount of 0 when no scheduled campaigns found", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/campaigns",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.processedCount).toBe(0);
    expect(data.totalFound).toBe(0);
  });

  it("returns 500 on internal error", async () => {
    payload.find.mockRejectedValueOnce(new Error("DB connection lost"));

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/campaigns",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });

  it("continues processing remaining campaigns when one fails", async () => {
    const mock = createMockPayload({
      stores: {
        campaigns: [
          {
            ...mockCampaign,
            id: "campaign-fail",
            status: "scheduled",
            scheduledAt: "2026-01-01T00:00:00.000Z",
          },
          {
            ...mockCampaign,
            id: "campaign-ok",
            status: "scheduled",
            scheduledAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    // First call fails, second succeeds
    vi.spyOn(global, "fetch")
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/cron/campaigns",
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.processedCount).toBe(1);
  });
});
