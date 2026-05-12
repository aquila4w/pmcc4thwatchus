import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockGetPayload } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockRegistration,
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

// Import after mocks are set up
import { GET } from "@/app/api/ticket/[code]/pdf/route";

describe("GET /api/ticket/[code]/pdf", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "event-registrations": [mockRegistration],
        "managed-events": [mockEvent],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
  });

  // 1. Returns HTML with guest name (PII preservation)
  it("returns HTML with guest name", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/ticket/REGCODE1/pdf",
    });
    const context = buildParams({ code: "REGCODE1" });

    const response = await GET(request, context);
    const html = await response.text();

    expect(html).toContain("Jane Guest");
  });

  // 2. Returns HTML with event title, date, location
  it("returns HTML with event title, date, and location", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/ticket/REGCODE1/pdf",
    });
    const context = buildParams({ code: "REGCODE1" });

    const response = await GET(request, context);
    const html = await response.text();

    expect(html).toContain("Summer Crusade 2026");
    expect(html).toContain("LA Convention Center");
    // The date should be formatted in the HTML
    expect(html).toContain("2026");
  });

  // 3. Returns Content-Type: text/html
  it("returns Content-Type text/html", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/ticket/REGCODE1/pdf",
    });
    const context = buildParams({ code: "REGCODE1" });

    const response = await GET(request, context);

    expect(response.headers.get("Content-Type")).toBe("text/html");
    expect(response.headers.get("Content-Disposition")).toContain("ticket-REGCODE1");
  });

  // 4. Returns 404 for invalid code
  it("returns 404 for invalid code", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/ticket/NONEXISTENT/pdf",
    });
    const context = buildParams({ code: "NONEXISTENT" });

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Registration not found");
  });

  // 5. XSS: guest name with <script>alert(1)</script> is escaped
  it("escapes XSS in guest name", async () => {
    const xssRegistration = {
      ...mockRegistration,
      id: "reg-xss",
      inviteCode: "XSSCODE1",
      guestInfo: {
        ...mockRegistration.guestInfo,
        name: '<script>alert(1)</script>',
      },
    };
    const mock = createMockPayload({
      stores: {
        "event-registrations": [xssRegistration],
        "managed-events": [mockEvent],
      },
    });
    mockGetPayload(mock.payload);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/ticket/XSSCODE1/pdf",
    });
    const context = buildParams({ code: "XSSCODE1" });

    const response = await GET(request, context);
    const html = await response.text();

    // Raw <script> tag must NOT appear in the output
    expect(html).not.toContain("<script>alert(1)</script>");
    // The escaped version should be present
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
