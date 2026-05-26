import { NextRequest, NextResponse } from "next/server";
import { getPayload, type Payload } from "payload";
import config from "@payload-config";
import { sendReminderEmail } from "@/lib/email";
import { sendRegistrationSMS, shortenUrl } from "@/lib/sms";
import { formatEventDate, formatEventTime } from "@/lib/event-date";

interface Event {
  id: string | number;
  title?: string;
  startDate?: string;
  location?: string;
  address?: string;
}

// Verify cron authorization
function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET environment variable is not set");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  return false;
}

// GET or POST - Process automatic reminders
export async function GET(request: NextRequest) {
  return processReminders(request);
}

export async function POST(request: NextRequest) {
  return processReminders(request);
}

async function processReminders(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyCronAuth(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await getPayload({ config });
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const twentySixHoursFromNow = new Date(now.getTime() + 26 * 60 * 60 * 1000);

    // Find events starting in ~1 hour (hour-before reminder)
    const hourBeforeEvents = await payload.find({
      collection: "managed-events",
      where: {
        and: [
          { status: { equals: "registration-open" } },
          {
            startDate: {
              greater_than_equal: now.toISOString(),
              less_than: oneHourFromNow.toISOString(),
            },
          },
        ],
      },
      limit: 50,
      depth: 0,
    });

    // Find events starting in ~25 hours (day-before reminder)
    const dayBeforeEvents = await payload.find({
      collection: "managed-events",
      where: {
        and: [
          { status: { equals: "registration-open" } },
          {
            startDate: {
              greater_than_equal: twentyFiveHoursFromNow.toISOString(),
              less_than: twentySixHoursFromNow.toISOString(),
            },
          },
        ],
      },
      limit: 50,
      depth: 0,
    });

    let processedCount = 0;

    // Process hour-before reminders
    for (const event of hourBeforeEvents.docs) {
      await sendEventReminders(payload, event, "hour-before");
      processedCount++;
    }

    // Process day-before reminders
    for (const event of dayBeforeEvents.docs) {
      await sendEventReminders(payload, event, "day-before");
      processedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Processed reminders for ${processedCount} event(s)`,
      hourBeforeCount: hourBeforeEvents.totalDocs,
      dayBeforeCount: dayBeforeEvents.totalDocs,
    });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Send reminders for a specific event
async function sendEventReminders(
  payload: Payload,
  event: Event,
  reminderType: "day-before" | "hour-before"
) {
  // Get all registrations for this event that haven't received this reminder yet
  const reminderField =
    reminderType === "day-before"
      ? "reminderDayBeforeSent"
      : "reminderHourBeforeSent";

  const registrations = await payload.find({
    collection: "event-registrations",
    where: {
      and: [
        { event: { equals: event.id } },
        { status: { in: ["registered", "waitlisted", "confirmed"] } },
        { [reminderField]: { equals: false } },
      ],
    },
    limit: 999,
    depth: 0,
  });

  // Format event date
  const eventDate = formatEventDate(event.startDate || "");
  const eventTime = formatEventTime(event.startDate || "");

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "https://pmcc4thwatch.us";

  for (const reg of registrations.docs) {
    const guestInfo = reg.guestInfo as {
      name?: string;
      email?: string;
      phone?: string;
    } | null;

    const ticketUrl = `${baseUrl}/ticket/${reg.inviteCode}`;

    // Send email
    if (guestInfo?.email) {
      try {
        await sendReminderEmail({
          to: guestInfo.email,
          guestName: guestInfo.name || "Guest",
          eventTitle: event.title || "Upcoming Event",
          eventDate: eventDate,
          eventLocation: event.location || "TBD",
          ticketUrl: ticketUrl,
          reminderType: reminderType,
        });
      } catch (error) {
        console.error("Reminder email send failed");
      }
    }

    // Send SMS
    if (guestInfo?.phone) {
      try {
        const shortUrl = await shortenUrl(ticketUrl);
        await sendRegistrationSMS({
          to: guestInfo.phone,
          guestName: guestInfo.name || "Guest",
          eventTitle: event.title || "Upcoming Event",
          ticketUrl: shortUrl,
        });
      } catch (error) {
        console.error("Reminder SMS send failed");
      }
    }

    // Update the reminder flag
    await payload.update({
      collection: "event-registrations",
      id: reg.id,
      data: {
        [reminderField]: true,
      },
    });
  }

  console.log(
    `Sent ${reminderType} reminders for "${event.title}": ${registrations.totalDocs} recipients`
  );
}
