import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

// GET - Export event registrations as CSV or generate analytics report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const type = searchParams.get("type") || "registrations"; // registrations, summary, attendance

    // Find the event
    const events = await payload.find({
      collection: "managed-events",
      where: { slug: { equals: slug } },
      limit: 1,
    });

    if (events.docs.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = events.docs[0] as unknown as EventDoc;

    // Get registrations for this event
    const registrations = await payload.find({
      collection: "event-registrations",
      where: { event: { equals: events.docs[0].id } },
      limit: 1000,
      depth: 2,
    });

    const registrationDocs = registrations.docs as unknown as RegistrationDoc[];

    if (type === "summary") {
      // Generate summary statistics
      const summary = generateSummary(registrationDocs, event);

      if (format === "json") {
        return NextResponse.json(summary);
      }

      // Generate summary CSV
      const csv = generateSummaryCSV(summary);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${slug}-summary-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (type === "attendance") {
      // Filter to only attended registrations
      const attended = registrationDocs.filter((r) => r.attended);
      const csv = generateRegistrationsCSV(attended, event, true);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${slug}-attendance-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Default: Export all registrations as CSV
    const csv = generateRegistrationsCSV(registrationDocs, event, false);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${slug}-registrations-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}

interface EventDoc {
  title?: string;
  date?: string;
  maxCapacity?: number;
}

interface RegistrationDoc {
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  ticketCode?: string;
  status?: string;
  attended?: boolean;
  attendedAt?: string;
  baptized?: boolean;
  baptizedAt?: string;
  waitlistPosition?: number;
  invitedBy?: { name?: string; inviteCode?: string } | string;
  createdAt?: string;
}

function generateSummary(registrations: RegistrationDoc[], event: EventDoc) {
  const total = registrations.length;
  const confirmed = registrations.filter(r => r.status === "confirmed").length;
  const waitlisted = registrations.filter(r => r.status === "waitlisted").length;
  const cancelled = registrations.filter(r => r.status === "cancelled").length;
  const attended = registrations.filter(r => r.attended).length;
  const baptized = registrations.filter(r => r.baptized).length;

  // Group by inviter
  const inviterStats: Record<string, number> = {};
  registrations.forEach(r => {
    const inviter = typeof r.invitedBy === "object" ? r.invitedBy?.name : "Direct Registration";
    const key = inviter || "Direct Registration";
    inviterStats[key] = (inviterStats[key] || 0) + 1;
  });

  // Sort inviters by count
  const topInviters = Object.entries(inviterStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return {
    eventTitle: event.title,
    eventDate: event.date,
    totalRegistrations: total,
    confirmed,
    waitlisted,
    cancelled,
    attended,
    attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
    baptized,
    capacity: event.maxCapacity || "Unlimited",
    capacityUsed: event.maxCapacity ? Math.round((confirmed / event.maxCapacity) * 100) : null,
    topInviters,
    exportedAt: new Date().toISOString(),
  };
}

function generateSummaryCSV(summary: ReturnType<typeof generateSummary>) {
  let csv = "Event Analytics Summary\n\n";
  csv += `Event,${summary.eventTitle}\n`;
  csv += `Date,${summary.eventDate || "TBD"}\n`;
  csv += `Exported At,${summary.exportedAt}\n\n`;

  csv += "Registration Statistics\n";
  csv += `Total Registrations,${summary.totalRegistrations}\n`;
  csv += `Confirmed,${summary.confirmed}\n`;
  csv += `Waitlisted,${summary.waitlisted}\n`;
  csv += `Cancelled,${summary.cancelled}\n`;
  csv += `Attended,${summary.attended}\n`;
  csv += `Attendance Rate,${summary.attendanceRate}%\n`;
  csv += `Baptized,${summary.baptized}\n\n`;

  if (summary.capacity !== "Unlimited") {
    csv += "Capacity\n";
    csv += `Max Capacity,${summary.capacity}\n`;
    csv += `Capacity Used,${summary.capacityUsed}%\n\n`;
  }

  csv += "Top Inviters\n";
  csv += "Name,Invites\n";
  summary.topInviters.forEach(inviter => {
    csv += `${inviter.name},${inviter.count}\n`;
  });

  return csv;
}

function generateRegistrationsCSV(registrations: RegistrationDoc[], event: EventDoc, attendanceOnly: boolean) {
  const headers = [
    "Ticket Code",
    "Guest Name",
    "Guest Email",
    "Guest Phone",
    "Status",
    "Invited By",
    "Registered At",
    "Attended",
    "Attended At",
    "Baptized",
    "Baptized At",
    ...(attendanceOnly ? [] : ["Waitlist Position"]),
  ];

  let csv = `Event: ${event.title}\n`;
  csv += `Export Date: ${new Date().toISOString()}\n`;
  csv += `Total Records: ${registrations.length}\n\n`;
  csv += headers.join(",") + "\n";

  registrations.forEach((r) => {
    const inviterName = typeof r.invitedBy === "object" ? r.invitedBy?.name : "Direct";
    const row = [
      r.ticketCode || "",
      `"${(r.guestName || "").replace(/"/g, '""')}"`,
      r.guestEmail || "",
      r.guestPhone || "",
      r.status || "",
      `"${(inviterName || "Direct").replace(/"/g, '""')}"`,
      r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
      r.attended ? "Yes" : "No",
      r.attendedAt ? new Date(r.attendedAt).toLocaleString() : "",
      r.baptized ? "Yes" : "No",
      r.baptizedAt ? new Date(r.baptizedAt).toLocaleString() : "",
      ...(attendanceOnly ? [] : [r.waitlistPosition?.toString() || ""]),
    ];
    csv += row.join(",") + "\n";
  });

  return csv;
}
