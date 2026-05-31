import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { setupModuleMocks, mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { getRateLimitMock, getRateLimitAsyncMock } from "../../helpers/mock-auth";
import { buildRequest } from "../../helpers/mock-request";
import { mockSuperAdmin, mockMember } from "../../helpers/fixtures";

// Setup module-level mocks
setupModuleMocks();

// Import handlers AFTER mocks are set up
import { POST } from "@/app/api/media/upload/route";

// Helper to create a mock File with specified size
function createMockFile(
  name: string,
  type: string,
  sizeInBytes: number
): File {
  const content = new ArrayBuffer(sizeInBytes);
  return new File([content], name, { type });
}

describe("POST /api/media/upload", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        media: [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain("Authentication required");
  });

  it("returns 403 when not admin", async () => {
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("Insufficient permissions");
  });

  it("returns 400 when no file provided", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });

    // Mock formData with no file
    const formData = new FormData();
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("No file provided");
  });

  it("returns 400 for file exceeding 10MB", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });

    // Create a file that exceeds 10MB (10 * 1024 * 1024 + 1 bytes)
    const oversizedFile = createMockFile("large.jpg", "image/jpeg", 10 * 1024 * 1024 + 1);
    const formData = new FormData();
    formData.append("file", oversizedFile);
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("10MB limit");
  });

  it("returns 400 for disallowed MIME type", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });

    const disallowedFile = createMockFile("malware.exe", "application/x-msdownload", 1024);
    const formData = new FormData();
    formData.append("file", disallowedFile);
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("not allowed");
  });

  it("returns 400 for text/plain MIME type", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });

    const textFile = createMockFile("notes.txt", "text/plain", 100);
    const formData = new FormData();
    formData.append("file", textFile);
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("not allowed");
  });

  it("successfully uploads a valid JPEG image", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });

    const validFile = createMockFile("photo.jpg", "image/jpeg", 1024 * 100); // 100KB
    const formData = new FormData();
    formData.append("file", validFile);
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty("id");

    // Verify payload.create was called with media collection
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "media",
        overrideAccess: true,
        data: expect.objectContaining({
          alt: "photo.jpg", // defaults to filename when no alt provided
        }),
        file: expect.objectContaining({
          mimetype: "image/jpeg",
          name: "photo.jpg",
        }),
      })
    );
  });

  it("successfully uploads a valid PNG image", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });

    const validFile = createMockFile("image.png", "image/png", 50 * 1024); // 50KB
    const formData = new FormData();
    formData.append("file", validFile);
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.objectContaining({ mimetype: "image/png" }),
      })
    );
  });

  it("successfully uploads a valid PDF", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });

    const validFile = createMockFile("document.pdf", "application/pdf", 2 * 1024 * 1024); // 2MB
    const formData = new FormData();
    formData.append("file", validFile);
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.objectContaining({ mimetype: "application/pdf" }),
      })
    );
  });

  it("uses provided alt text instead of filename", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });

    const validFile = createMockFile("photo.jpg", "image/jpeg", 1024);
    const formData = new FormData();
    formData.append("file", validFile);
    formData.append("alt", "Custom alt text for accessibility");
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          alt: "Custom alt text for accessibility",
        }),
      })
    );
  });

  it("trims and limits alt text to 200 characters", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });

    const validFile = createMockFile("photo.jpg", "image/jpeg", 1024);
    const longAlt = "  " + "A".repeat(250) + "  ";
    const formData = new FormData();
    formData.append("file", validFile);
    formData.append("alt", longAlt);
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    const response = await POST(request);

    expect(response.status).toBe(201);
    const createCall = payload.create.mock.calls[0][0];
    // Should be trimmed and limited to 200 chars
    expect(createCall.data.alt).toHaveLength(200);
    expect(createCall.data.alt).not.toMatch(/^\s/);
  });

  it("returns 429 when rate limited", async () => {
    const rateLimitAsync = getRateLimitAsyncMock();
    rateLimitAsync.mockResolvedValueOnce({ allowed: false, resetIn: 60000 });

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain("Too many");
  });

  it("returns 500 on internal error", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/media/upload",
    });

    const validFile = createMockFile("photo.jpg", "image/jpeg", 1024);
    const formData = new FormData();
    formData.append("file", validFile);
    vi.spyOn(request, "formData").mockResolvedValue(formData);

    payload.create.mockRejectedValueOnce(new Error("Storage error"));

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Storage error");
  });
});
