import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupModuleMocks, mockGetPayload, mockAuthenticatedUser } from "../../helpers/mock-auth";
import { createMockPayload } from "../../helpers/mock-payload";
import { buildRequest, buildParams } from "../../helpers/mock-request";
import {
  mockSuperAdmin,
  mockMember,
  mockEvent,
  mockChurch,
} from "../../helpers/fixtures";

setupModuleMocks();

// Set required env vars
process.env.NEXT_PUBLIC_SERVER_URL = "https://pmcc4thwatch.us";

// Import after mocks are set up
import { GET as exportGET } from "@/app/api/events/[eventId]/export/route";
import { POST as importPOST } from "@/app/api/events/[eventId]/import/route";

describe("Export/Import Flow: Export registrations -> Import round-trip", () => {
  let payload: ReturnType<typeof createMockPayload>["payload"];
  let data: ReturnType<typeof createMockPayload>["data"];

  // Registrations with full guestInfo for export/import testing
  const exportRegistrations = [
    {
      id: "reg-exp-1",
      registrationCode: "EXP001",
      event: "event-1",
      guestName: "Export User One",
      guestEmail: "export1@example.com",
      guestPhone: "+15551112001",
      guestInfo: {
        name: "Export User One",
        email: "export1@example.com",
        phone: "+15551112001",
      },
      status: "registered",
      createdAt: "2026-06-15T10:00:00.000Z",
    },
    {
      id: "reg-exp-2",
      registrationCode: "EXP002",
      event: "event-1",
      guestName: "Export User Two",
      guestEmail: "export2@example.com",
      guestPhone: "+15551112002",
      guestInfo: {
        name: "Export User Two",
        email: "export2@example.com",
        phone: "+15551112002",
      },
      status: "attended",
      checkedInAt: "2026-07-15T09:30:00.000Z",
      createdAt: "2026-06-16T10:00:00.000Z",
    },
    {
      id: "reg-exp-3",
      registrationCode: "EXP003",
      event: "event-1",
      guestName: "Export User Three",
      guestEmail: "export3@example.com",
      guestPhone: "+15551112003",
      guestInfo: {
        name: "Export User Three",
        email: "export3@example.com",
        phone: "+15551112003",
      },
      status: "baptized",
      checkedInAt: "2026-07-15T09:30:00.000Z",
      baptizedAt: "2026-07-15T11:00:00.000Z",
      createdAt: "2026-06-17T10:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    const mock = createMockPayload({
      stores: {
        users: [mockSuperAdmin, mockMember],
        "managed-events": [mockEvent],
        "event-registrations": [...exportRegistrations],
        "event-invites": [],
        churches: [mockChurch],
      },
    });
    payload = mock.payload;
    data = mock.data;
    mockGetPayload(payload);
    mockAuthenticatedUser(mockSuperAdmin);
  });

  it("step 1: data store has registrations with full guestInfo", async () => {
    expect(data["event-registrations"].length).toBe(3);

    const reg = data["event-registrations"][0] as Record<string, unknown>;
    expect(reg.guestInfo).toBeDefined();
    expect((reg.guestInfo as Record<string, unknown>).name).toBe("Export User One");
    expect((reg.guestInfo as Record<string, unknown>).email).toBe("export1@example.com");
    expect((reg.guestInfo as Record<string, unknown>).phone).toBe("+15551112001");
  });

  it("step 2: GET /api/events/[eventId]/export returns data with PII", async () => {
    const request = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export?format=json&type=all",
    });
    const context = buildParams({ eventId: "event-1" });

    const response = await exportGET(request, context);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.event).toBeDefined();
    expect(result.event.id).toBe("event-1");
    expect(result.event.title).toBe("Summer Crusade 2026");

    expect(result.data).toBeDefined();
    expect(result.total).toBe(3);

    // Verify PII fields are present in export data
    const exportedNames = result.data.map(
      (row: Record<string, string>) => row["Guest Name"]
    );
    expect(exportedNames).toContain("Export User One");
    expect(exportedNames).toContain("Export User Two");
    expect(exportedNames).toContain("Export User Three");

    // Verify email and phone (PII) are exported
    const firstRow = result.data[0] as Record<string, string>;
    expect(firstRow["Guest Email"]).toBe("export1@example.com");
    expect(firstRow["Guest Phone"]).toBe("+15551112001");
    expect(firstRow["Registration Code"]).toBe("EXP001");
  });

  it("step 3: POST /api/events/[eventId]/import reimports registrations", async () => {
    // Clear registrations to simulate importing into a fresh event
    data["event-registrations"] = [];

    const importPayload = [
      {
        registrationCode: "EXP001",
        guestName: "Export User One",
        guestEmail: "export1@example.com",
        guestPhone: "+15551112001",
        status: "registered",
      },
      {
        registrationCode: "EXP002",
        guestName: "Export User Two",
        guestEmail: "export2@example.com",
        guestPhone: "+15551112002",
        status: "attended",
        checkedInAt: "2026-07-15T09:30:00.000Z",
      },
      {
        registrationCode: "EXP003",
        guestName: "Export User Three",
        guestEmail: "export3@example.com",
        guestPhone: "+15551112003",
        status: "baptized",
        checkedInAt: "2026-07-15T09:30:00.000Z",
        baptizedAt: "2026-07-15T11:00:00.000Z",
      },
    ];

    const request = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/import",
      body: { registrations: importPayload },
    });
    const context = buildParams({ eventId: "event-1" });

    const response = await importPOST(request, context);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.created).toBe(3);
    expect(result.updated).toBe(0);
    expect(result.message).toContain("3 created");
  });

  it("step 4: data preserved after round-trip (guestInfo with name, email, phone intact)", async () => {
    // Simulate the round-trip: export, clear, import
    // Step 1: Get the exported data
    const exportRequest = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/events/event-1/export?format=json&type=all",
    });
    const exportContext = buildParams({ eventId: "event-1" });
    const exportResponse = await exportGET(exportRequest, exportContext);
    const exportResult = await exportResponse.json();

    // Step 2: Clear the data store
    data["event-registrations"] = [];

    // Step 3: Map exported data to import format
    const importRegistrations = exportResult.data.map(
      (row: Record<string, string>) => ({
        registrationCode: row["Registration Code"],
        guestName: row["Guest Name"],
        guestEmail: row["Guest Email"],
        guestPhone: row["Guest Phone"],
        status: row["Status"],
        checkedInAt: row["Checked In At"] || undefined,
        baptizedAt: row["Baptized At"] || undefined,
      })
    );

    const importRequest = buildRequest({
      method: "POST",
      url: "http://localhost:3000/api/events/event-1/import",
      body: { registrations: importRegistrations },
    });
    const importContext = buildParams({ eventId: "event-1" });

    const importResponse = await importPOST(importRequest, importContext);
    const importResult = await importResponse.json();

    expect(importResponse.status).toBe(200);
    expect(importResult.success).toBe(true);
    expect(importResult.created).toBe(3);

    // Step 4: Verify data integrity after round-trip
    expect(data["event-registrations"].length).toBe(3);

    // Check each imported record has preserved PII
    const importedNames = data["event-registrations"].map(
      (r) => (r as Record<string, unknown>).guestName
    );
    expect(importedNames).toContain("Export User One");
    expect(importedNames).toContain("Export User Two");
    expect(importedNames).toContain("Export User Three");

    // Verify specific fields preserved
    const user1 = data["event-registrations"].find(
      (r) => (r as Record<string, unknown>).guestName === "Export User One"
    ) as Record<string, unknown>;
    expect(user1.guestEmail).toBe("export1@example.com");
    expect(user1.guestPhone).toBe("+15551112001");
    expect(user1.event).toBe("event-1");
    expect(user1.status).toBe("registered");

    const user2 = data["event-registrations"].find(
      (r) => (r as Record<string, unknown>).guestName === "Export User Two"
    ) as Record<string, unknown>;
    expect(user2.guestEmail).toBe("export2@example.com");
    expect(user2.status).toBe("attended");

    const user3 = data["event-registrations"].find(
      (r) => (r as Record<string, unknown>).guestName === "Export User Three"
    ) as Record<string, unknown>;
    expect(user3.guestEmail).toBe("export3@example.com");
    expect(user3.status).toBe("baptized");
  });
});
