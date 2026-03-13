import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

interface EventRegistration {
  registrationCode?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  status?: string;
  checkedInAt?: string;
  baptizedAt?: string;
  createdAt?: string;
}

interface Event {
  id: string;
  title: string;
  startDate?: string;
  location?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";
    const type = searchParams.get("type") || "all";

    // Get event details
    const event = await payload.findByID({
      collection: "managed-events",
      id: eventId,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get registrations
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        event: { equals: eventId },
      },
      depth: 1,
      limit: 9999,
    });

    // Format data based on type
    let exportData: Record<string, string | number>[] = [];

    if (type === "all" || type === "registrations") {
      exportData = registrations.docs.map((reg) => {
        const regData = reg as Record<string, unknown>;
        return {
          "Registration Code": String(regData.registrationCode || ""),
          "Guest Name": String(regData.guestName || ""),
          "Guest Email": String(regData.guestEmail || ""),
          "Guest Phone": String(regData.guestPhone || ""),
          Status: String(regData.status || ""),
          "Checked In At": regData.checkedInAt
            ? new Date(String(regData.checkedInAt)).toISOString()
            : "",
          "Baptized At": regData.baptizedAt
            ? new Date(String(regData.baptizedAt)).toISOString()
            : "",
          "Registered At": regData.createdAt
            ? new Date(String(regData.createdAt)).toISOString()
            : "",
        };
      });
    }

    if (type === "attendance") {
      exportData = registrations.docs
        .filter((reg) => {
          const status = (reg as Record<string, unknown>).status;
          return status === "attended" || status === "baptized";
        })
        .map((reg) => {
          const regData = reg as Record<string, unknown>;
          return {
            "Registration Code": String(regData.registrationCode || ""),
            "Guest Name": String(regData.guestName || ""),
            "Guest Phone": String(regData.guestPhone || ""),
            Status: String(regData.status || ""),
            "Checked In At": regData.checkedInAt
              ? new Date(String(regData.checkedInAt)).toISOString()
              : "",
          };
        });
    }

    if (type === "summary") {
      exportData = [
        {
          "Event Title": event.title,
          "Event Date": event.startDate
            ? new Date(event.startDate).toISOString()
            : "",
          Location: event.location || "",
          "Total Registrations": registrations.totalDocs,
          "Attended": registrations.docs.filter(
            (r) => {
              const status = (r as Record<string, unknown>).status;
              return status === "attended" || status === "baptized";
            }
          ).length,
          "Baptized": registrations.docs.filter(
            (r) => (r as Record<string, unknown>).status === "baptized"
          ).length,
        },
      ];
    }

    // Return based on format
    if (format === "csv") {
      // Convert to CSV
      if (exportData.length === 0) {
        return NextResponse.json({ error: "No data to export" }, { status: 404 });
      }

      const headers = Object.keys(exportData[0]);
      const csvRows = [
        headers.join(","),
        ...exportData.map((row) =>
          headers.map((header) => {
            const value = row[header] || "";
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(",")
        ),
      ];

      const csv = csvRows.join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${event.title.replace(
            /[^a-z0-9]/gi,
            "_"
          )}_export.csv"`,
        },
      });
    }

    // Default to JSON
    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        startDate: event.startDate,
      },
      data: exportData,
      total: exportData.length,
    });
  } catch (error) {
    console.error("Event export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
