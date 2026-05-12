import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPayload } from "../../helpers/mock-payload";
import { mockAuthenticatedUser, mockGetPayload } from "../../helpers/mock-auth";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockEvent,
  mockEventInvite,
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

import { GET, POST } from "@/app/api/events/[eventId]/invites/route";

describe("GET /api/events/[eventId]/invites", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  const invites = [
    {
      id: "invite-1",
      inviteCode: "ABCD1234",
      event: "event-1",
      invitedBy: { id: "member-1", name: "John Member" },
      church: "church-1",
      memberContactName: "John Member",
      memberContactPhone: "+15551002000",
      memberContactEmail: "john@example.com",
      registrationCount: 3,
      status: "active",
    },
    {
      id: "invite-2",
      inviteCode: "EFGH5678",
      event: "event-1",
      invitedBy: { id: "member-2", name: "Jane Member" },
      church: "church-2",
      memberContactName: "Jane Member",
      memberContactPhone: "+15551002001",
      memberContactEmail: "jane@member.com",
      registrationCount: 1,
      status: "active",
    },
  ];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "event-invites": invites,
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
  });

  it("returns invites with member contact PII (public endpoint)", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/invites",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invites).toHaveLength(2);
    expect(data.total).toBe(2);

    // Verify PII is present
    const firstInvite = data.invites[0];
    expect(firstInvite.memberName).toBe("John Member");
    expect(firstInvite.memberPhone).toBe("+15551002000");
    expect(firstInvite.memberEmail).toBe("john@example.com");
    expect(firstInvite.inviteCode).toBe("ABCD1234");
    expect(firstInvite.registrationCount).toBe(3);
  });

  it("filters invites by church", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/invites?church=church-1",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invites).toHaveLength(1);
    expect(data.invites[0].church).toBe("church-1");
  });

  it("returns empty invites for event with no invites", async () => {
    const mock = createMockPayload({
      stores: {
        "event-invites": [],
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/invites",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invites).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  it("sorts invites by memberContactName", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/invites",
    });
    await GET(request, buildParams({ eventId: "event-1" }));

    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "event-invites",
        sort: "memberContactName",
      })
    );
  });

  it("returns 500 on internal error", async () => {
    payload.find.mockRejectedValueOnce(new Error("DB error"));
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/invites",
    });
    const response = await GET(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(500);
  });
});

describe("POST /api/events/[eventId]/invites", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];

  const members = [
    {
      id: "member-1",
      name: "John Member",
      email: "john@example.com",
      phone: "+15551002000",
      role: "member",
      status: "approved",
      church: "church-1",
    },
    {
      id: "member-2",
      name: "Jane Member",
      email: "jane@member.com",
      phone: "+15551002001",
      role: "headMinister",
      status: "approved",
      church: "church-1",
    },
  ];

  beforeEach(() => {
    const mock = createMockPayload({
      stores: {
        "managed-events": [{ ...mockEvent, id: "event-1" }],
        "event-invites": [],
        users: members,
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("generates invites for approved members", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/invites",
      body: {},
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.created).toBe(2);
    expect(data.totalMembers).toBe(2);
    expect(payload.create).toHaveBeenCalledTimes(2);
  });

  it("creates invites with correct event and member data", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/invites",
      body: {},
    });
    await POST(request, buildParams({ eventId: "event-1" }));

    // Verify each create call has the correct structure
    for (const call of payload.create.mock.calls) {
      expect(call[0].collection).toBe("event-invites");
      expect(call[0].data.event).toBe("event-1");
      expect(call[0].data.status).toBe("active");
      expect(call[0].data.invitedBy).toBeDefined();
    }
  });

  it("skips members who already have invites", async () => {
    // Setup: member-1 already has an invite
    const mock = createMockPayload({
      stores: {
        "managed-events": [{ ...mockEvent, id: "event-1" }],
        "event-invites": [
          {
            id: "existing-invite-1",
            inviteCode: "EXIST01",
            event: "event-1",
            invitedBy: "member-1",
            church: "church-1",
            memberContactName: "John Member",
            status: "active",
          },
        ],
        users: members,
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/invites",
      body: {},
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.created).toBe(1); // Only member-2 gets new invite
    expect(payload.create).toHaveBeenCalledTimes(1);
  });

  it("regenerates invite codes when regenerate=true", async () => {
    // Setup: member-1 already has an invite
    const mock = createMockPayload({
      stores: {
        "managed-events": [{ ...mockEvent, id: "event-1" }],
        "event-invites": [
          {
            id: "existing-invite-1",
            inviteCode: "EXIST01",
            event: "event-1",
            invitedBy: "member-1",
            church: "church-1",
            memberContactName: "John Member",
            status: "active",
          },
        ],
        users: members,
      },
    });
    payload = mock.payload;
    mockGetPayload(payload);

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/invites",
      body: { regenerate: true },
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // member-1 gets regenerated, member-2 gets created
    expect(data.created).toBe(1);
    expect(data.regenerated).toBe(1);
    expect(payload.update).toHaveBeenCalledTimes(1); // regenerate uses update
  });

  it("filters members by churchId when provided", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/invites",
      body: { churchId: "church-1" },
    });
    await POST(request, buildParams({ eventId: "event-1" }));

    // Verify the members query includes church filter
    const memberFindCall = payload.find.mock.calls.find(
      (call: any[]) => call[0].collection === "users"
    );
    expect(memberFindCall).toBeDefined();
    expect(memberFindCall![0].where.and).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ church: { equals: "church-1" } }),
      ])
    );
  });

  it("returns 404 for nonexistent event", async () => {
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/nonexistent/invites",
      body: {},
    });
    const response = await POST(request, buildParams({ eventId: "nonexistent" }));

    expect(response.status).toBe(500);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthenticatedUser(null);
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/invites",
      body: {},
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    mockAuthenticatedUser(mockMember);
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/invites",
      body: {},
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(403);
  });

  it("returns 500 on internal error", async () => {
    payload.findByID.mockRejectedValueOnce(new Error("DB error"));
    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/invites",
      body: {},
    });
    const response = await POST(request, buildParams({ eventId: "event-1" }));

    expect(response.status).toBe(500);
  });
});
