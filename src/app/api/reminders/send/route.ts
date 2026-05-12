import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { sendReminderEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });

    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const now = new Date();

    // Find events in reminder windows
    const dayBeforeStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const dayBeforeEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const hourBeforeStart = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const hourBeforeEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const results = { dayBefore: 0, hourBefore: 0, errors: [] as string[] };

    // Day-before reminders
    const dayEvents = await payload.find({
      collection: "managed-events",
      where: {
        startDate: { greater_than_equal: dayBeforeStart.toISOString(), less_than: dayBeforeEnd.toISOString() },
        status: { in: ["registration-open", "registration-closed", "in-progress"] },
      },
      limit: 100,
    });

    for (const event of dayEvents.docs) {
      const regs = await payload.find({
        collection: "event-registrations",
        where: { event: { equals: event.id }, status: { in: ["registered", "confirmed"] }, reminderDayBeforeSent: { equals: false } },
        limit: 1000,
      });

      for (const reg of regs.docs) {
        if (reg.guestInfo?.email) {
          try {
            await sendReminderEmail({
              to: reg.guestInfo.email,
              guestName: reg.guestInfo.name || "Guest",
              eventTitle: event.title,
              eventDate: new Date(event.startDate as string).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }),
              eventLocation: event.location || "TBD",
              ticketUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/ticket/${reg.inviteCode}`,
              reminderType: "day-before",
            });
            await payload.update({ collection: "event-registrations", id: reg.id, data: { reminderDayBeforeSent: true } });
            results.dayBefore++;
          } catch (e) { results.errors.push(`${reg.guestInfo.email}: ${e}`); }
        }
      }
    }

    // Hour-before reminders
    const hourEvents = await payload.find({
      collection: "managed-events",
      where: {
        startDate: { greater_than_equal: hourBeforeStart.toISOString(), less_than: hourBeforeEnd.toISOString() },
        status: { in: ["registration-open", "registration-closed", "in-progress"] },
      },
      limit: 100,
    });

    for (const event of hourEvents.docs) {
      const regs = await payload.find({
        collection: "event-registrations",
        where: { event: { equals: event.id }, status: { in: ["registered", "confirmed"] }, reminderHourBeforeSent: { equals: false } },
        limit: 1000,
      });

      for (const reg of regs.docs) {
        if (reg.guestInfo?.email) {
          try {
            await sendReminderEmail({
              to: reg.guestInfo.email,
              guestName: reg.guestInfo.name || "Guest",
              eventTitle: event.title,
              eventDate: new Date(event.startDate as string).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }),
              eventLocation: event.location || "TBD",
              ticketUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/ticket/${reg.inviteCode}`,
              reminderType: "hour-before",
            });
            await payload.update({ collection: "event-registrations", id: reg.id, data: { reminderHourBeforeSent: true } });
            results.hourBefore++;
          } catch (e) { results.errors.push(`${reg.guestInfo.email}: ${e}`); }
        }
      }
    }

    return NextResponse.json({ success: true, sent: results.dayBefore + results.hourBefore, ...results });
  } catch (error) {
    console.error("Reminder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
