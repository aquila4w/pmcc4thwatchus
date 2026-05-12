import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { buildRequest } from "../../helpers/mock-request";
import { mockSuperAdmin, mockMember } from "../../helpers/fixtures";

// Setup module-level mocks
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

// Import handlers AFTER mocks are set up
import { GET, POST } from "@/app/api/admin/upload-quad-image/route";

describe("GET /api/admin/upload-quad-image", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "news-events": [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
  });

  afterEach(() => {
    // Restore NODE_ENV
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  it("returns 403 in production environment", async () => {
    process.env.NODE_ENV = "production";

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("only available in development");
  });

  it("returns found: true with event data in development mode", async () => {
    process.env.NODE_ENV = "development";

    const mock = createMockPayload({
      stores: {
        "news-events": [
          {
            id: "news-1",
            title: "US District Quad Events 2026",
            slug: "us-district-quad-events-2026",
            heroImage: null,
            featuredImage: null,
          },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.found).toBe(true);
    expect(data.newsEvent.title).toBe("US District Quad Events 2026");
  });

  it("returns found: false when quad events not found", async () => {
    process.env.NODE_ENV = "development";

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.found).toBe(false);
    expect(data.message).toContain("not found");
  });
});

describe("POST /api/admin/upload-quad-image", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "news-events": [
          {
            id: "news-1",
            title: "US District Quad Events 2026",
            slug: "us-district-quad-events-2026",
          },
        ],
        media: [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  it("returns 403 in production environment", async () => {
    process.env.NODE_ENV = "production";

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/upload-quad-image",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("only available in development");
  });

  it("returns 401 when not authenticated in development mode", async () => {
    process.env.NODE_ENV = "development";
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/upload-quad-image",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain("Authentication required");
  });

  it("returns 403 when user is not admin in development mode", async () => {
    process.env.NODE_ENV = "development";
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/upload-quad-image",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("Insufficient permissions");
  });

  it("creates media and updates news-event in development mode with admin auth", async () => {
    process.env.NODE_ENV = "development";

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/upload-quad-image",
    });

    // Mock formData to return a file
    const mockFile = new File(["test image data"], "test.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", mockFile);
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("uploaded");

    // Verify media was created
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "media",
        data: expect.objectContaining({
          alt: expect.stringContaining("US District Quad Events"),
        }),
      })
    );

    // Verify news-event was updated with media reference
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "news-events",
        id: "news-1",
        data: expect.objectContaining({
          heroImage: expect.any(String),
          featuredImage: expect.any(String),
        }),
      })
    );
  });

  it("returns 404 when US District Quad Events not found", async () => {
    process.env.NODE_ENV = "development";

    // Empty news-events store
    const mock = createMockPayload({
      stores: {
        "news-events": [],
        media: [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/upload-quad-image",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("returns 400 when no file provided", async () => {
    process.env.NODE_ENV = "development";

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/upload-quad-image",
    });

    // Mock formData with no file
    const formData = new FormData();
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("No file provided");
  });

  it("returns 500 on internal error", async () => {
    process.env.NODE_ENV = "development";
    payload.find.mockRejectedValueOnce(new Error("DB error"));

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/upload-quad-image",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Failed to upload");
  });
});
