import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { setupModuleMocks, mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { buildRequest } from "../../helpers/mock-request";
import { mockSuperAdmin, mockMember } from "../../helpers/fixtures";

// Setup module-level mocks
setupModuleMocks();

// Import handlers AFTER mocks are set up
import { GET, POST } from "@/app/api/news-events/route";

const sampleNewsEvent = {
  id: "news-1",
  type: "event",
  title: "Summer Crusade 2026",
  subtitle: "Annual revival event",
  slug: "summer-crusade-2026",
  description: "Join us for our annual summer crusade",
  eventDate: "2026-07-15T10:00:00.000Z",
  endDate: "2026-07-15T18:00:00.000Z",
  location: "LA Convention Center",
  address: "1201 S Figueroa St, Los Angeles, CA 90015",
  eventType: "general",
  heroImage: null,
  featuredImage: null,
  gallery: [],
  tags: [],
  categories: [],
  isPublished: true,
  showOnHomepage: false,
  homepageOrder: 0,
  isFeatured: false,
  requiresRegistration: false,
  registrationUrl: "",
  contactEmail: "",
  contactPhone: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const sampleNews = {
  id: "news-2",
  type: "news",
  title: "Church Renovation Complete",
  subtitle: "Building updates",
  slug: "church-renovation-complete",
  description: "The church renovation project is complete.",
  newsDate: "2026-03-01T00:00:00.000Z",
  content: "<p>Renovation details here</p>",
  eventType: "general",
  heroImage: null,
  featuredImage: null,
  gallery: [],
  tags: [],
  categories: [],
  isPublished: true,
  showOnHomepage: true,
  homepageOrder: 1,
  isFeatured: false,
  requiresRegistration: false,
  registrationUrl: "",
  contactEmail: "",
  contactPhone: "",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
};

describe("GET /api/news-events", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "news-events": [sampleNewsEvent, sampleNews],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
  });

  it("returns items with transformed data", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/news-events",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(2);
    expect(data.totalDocs).toBe(2);
    // Verify transformed fields
    expect(data.items[0].startDate).toBe(sampleNewsEvent.eventDate);
    expect(data.items[0]).toHaveProperty("slug");
    expect(data.items[0]).toHaveProperty("eventType");
  });

  it("supports type filter for events only", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/news-events?type=event",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].type).toBe("event");
  });

  it("supports type filter for news only", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/news-events?type=news",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].type).toBe("news");
  });

  it("supports search filter across title", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/news-events?search=Summer",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].title).toContain("Summer");
  });

  it("supports search filter across description", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/news-events?search=renovation",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].title).toContain("Renovation");
  });

  it("supports homepage filter", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/news-events?homepage=true",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].showOnHomepage).toBe(true);
  });

  it("supports pagination with limit and page", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/news-events?limit=1&page=1",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.totalDocs).toBe(2);
    expect(data.page).toBe(1);
  });

  it("includes media URLs in transformed data when heroImage is present", async () => {
    const eventWithImage = {
      ...sampleNewsEvent,
      id: "news-img",
      heroImage: { url: "/media/hero.jpg", alt: "Hero image" },
      featuredImage: { url: "/media/featured.jpg", alt: "Featured image" },
    };

    const mock = createMockPayload({
      stores: {
        "news-events": [eventWithImage],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/news-events",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items[0].heroImage).toEqual({
      url: "/media/hero.jpg",
      alt: "Hero image",
    });
    expect(data.items[0].featuredImage).toEqual({
      url: "/media/featured.jpg",
      alt: "Featured image",
    });
  });

  it("returns empty array when no items match filter", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/news-events?search=nonexistent",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(0);
    expect(data.totalDocs).toBe(0);
  });

  it("returns 500 on internal error", async () => {
    payload.find.mockRejectedValueOnce(new Error("DB down"));

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/news-events",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Failed to fetch");
  });
});

describe("POST /api/news-events", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "news-events": [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("creates item with admin auth and returns 201", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/news-events",
      body: {
        title: "New Church Event",
        type: "event",
        description: "A wonderful event",
        location: "San Diego",
      },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.item.title).toBe("New Church Event");
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "news-events",
        data: expect.objectContaining({ title: "New Church Event" }),
      })
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/news-events",
      body: { title: "Test", type: "news" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain("Authentication required");
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/news-events",
      body: { title: "Test", type: "news" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("Insufficient permissions");
  });

  it("validates title is required", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/news-events",
      body: { type: "news" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("title");
    expect(data.error).toContain("required");
  });

  it("validates type is required", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/news-events",
      body: { title: "Test Title" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("type");
    expect(data.error).toContain("required");
  });

  it("validates type must be news or event", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/news-events",
      body: { title: "Test Title", type: "invalid" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("'news' or 'event'");
  });

  it("auto-generates slug from title", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/news-events",
      body: { title: "My Awesome Event!!! Here  ", type: "event" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: "my-awesome-event-here",
        }),
      })
    );
  });

  it("uses provided slug if given", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/news-events",
      body: { title: "Test Event", type: "event", slug: "custom-slug" },
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: "custom-slug",
        }),
      })
    );
  });

  it("returns 409 when slug already exists", async () => {
    const mock = createMockPayload({
      stores: {
        "news-events": [
          { id: "existing-1", slug: "existing-slug", title: "Existing" },
        ],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/news-events",
      body: { title: "Existing", type: "news", slug: "existing-slug" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain("slug already exists");
  });

  it("returns 500 on internal error", async () => {
    payload.find.mockRejectedValueOnce(new Error("DB error"));

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/news-events",
      body: { title: "Failing", type: "news" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Failed to create");
  });
});
