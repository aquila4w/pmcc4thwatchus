import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { slug } = await params;

    // Find the event by slug or ID
    const events = await payload.find({
      collection: "managed-events",
      where: {
        or: [
          { slug: { equals: slug } },
          { id: { equals: slug } },
        ],
      },
      limit: 1,
    });

    if (events.docs.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = events.docs[0];

    // Get all registrations for this event
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        event: { equals: event.id },
      },
      limit: 10000,
      sort: "-attendedAt",
      depth: 1,
    });

    // Calculate stats
    const stats = {
      total: registrations.totalDocs,
      registered: 0,
      waitlisted: 0,
      attended: 0,
      baptized: 0,
      cancelled: 0,
    };

    const recentCheckIns: Array<{
      id: string;
      name: string;
      email: string;
      time: string;
      status: string;
      invitedBy: string | null;
    }> = [];

    const hourlyCheckIns: Record<string, number> = {};

    registrations.docs.forEach((reg) => {
      // Count by status
      switch (reg.status) {
        case "registered":
        case "confirmed":
          stats.registered++;
          break;
        case "waitlisted":
          stats.waitlisted++;
          break;
        case "attended":
          stats.attended++;
          break;
        case "baptized":
          stats.attended++;
          stats.baptized++;
          break;
        case "cancelled":
          stats.cancelled++;
          break;
      }

      // Recent check-ins (last 20)
      if ((reg.status === "attended" || reg.status === "baptized") && reg.attendedAt) {
        if (recentCheckIns.length < 20) {
          const invitedBy = reg.invitedBy as { name?: string } | null;
          recentCheckIns.push({
            id: String(reg.id),
            name: reg.guestInfo?.name || "Unknown",
            email: reg.guestInfo?.email || "",
            time: reg.attendedAt as string,
            status: reg.status,
            invitedBy: invitedBy?.name || null,
          });
        }

        // Hourly distribution
        const hour = new Date(reg.attendedAt as string).getHours();
        const hourKey = `${hour.toString().padStart(2, "0")}:00`;
        hourlyCheckIns[hourKey] = (hourlyCheckIns[hourKey] || 0) + 1;
      }
    });

    // Registration timeline (registrations per day)
    const dailyRegistrations: Record<string, number> = {};
    registrations.docs.forEach((reg) => {
      if (reg.registeredAt) {
        const date = new Date(reg.registeredAt as string).toISOString().split("T")[0];
        dailyRegistrations[date] = (dailyRegistrations[date] || 0) + 1;
      }
    });

    // Top inviters
    const inviterCounts: Record<string, { name: string; count: number; attended: number }> = {};
    registrations.docs.forEach((reg) => {
      const inviter = reg.invitedBy as { id?: string; name?: string } | null;
      if (inviter?.id) {
        const inviterId = String(inviter.id);
        if (!inviterCounts[inviterId]) {
          inviterCounts[inviterId] = { name: inviter.name || "Unknown", count: 0, attended: 0 };
        }
        inviterCounts[inviterId].count++;
        if (reg.status === "attended" || reg.status === "baptized") {
          inviterCounts[inviterId].attended++;
        }
      }
    });

    const topInviters = Object.entries(inviterCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        location: event.location,
        maxAttendees: event.maxAttendees,
        hasBaptism: event.hasBaptism,
      },
      stats,
      recentCheckIns,
      hourlyCheckIns: Object.entries(hourlyCheckIns)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour)),
      dailyRegistrations: Object.entries(dailyRegistrations)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topInviters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
