import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

// POST - Promote next person from waitlist to confirmed
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const body = await request.json();
    const { eventId, count = 1 } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Get the event to check capacity
    const event = await payload.findByID({
      collection: "managed-events",
      id: eventId,
      depth: 0,
      overrideAccess: true,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get current confirmed count
    const confirmedCount = await payload.count({
      collection: "event-registrations",
      where: {
        event: { equals: eventId },
        status: { equals: "confirmed" },
      },
    });

    const maxCapacity = (event as { maxCapacity?: number }).maxCapacity || null;
    const availableSpots = maxCapacity ? maxCapacity - confirmedCount.totalDocs : count;

    if (availableSpots <= 0) {
      return NextResponse.json({
        error: "No available spots",
        confirmed: confirmedCount.totalDocs,
        maxCapacity
      }, { status: 400 });
    }

    // Get waitlisted registrations ordered by position
    const waitlisted = await payload.find({
      collection: "event-registrations",
      where: {
        event: { equals: eventId },
        status: { equals: "waitlisted" },
      },
      sort: "waitlistPosition",
      limit: Math.min(count, availableSpots),
    });

    if (waitlisted.docs.length === 0) {
      return NextResponse.json({
        message: "No one on waitlist to promote",
        promoted: 0
      });
    }

    // Promote each waitlisted registration
    const promoted: Array<{ id: string; guestName: string; guestEmail: string }> = [];
    const notifications: Array<{ email: string; name: string; ticketCode: string }> = [];

    for (const registration of waitlisted.docs) {
      const reg = registration as {
        id: string;
        guestName?: string;
        guestEmail?: string;
        ticketCode?: string;
      };

      await payload.update({
        collection: "event-registrations",
        id: reg.id,
        data: {
          status: "confirmed",
          waitlistPosition: null,
          promotedFromWaitlistAt: new Date().toISOString(),
        },
      });

      promoted.push({
        id: reg.id,
        guestName: reg.guestName || "Guest",
        guestEmail: reg.guestEmail || "",
      });

      if (reg.guestEmail) {
        notifications.push({
          email: reg.guestEmail,
          name: reg.guestName || "Guest",
          ticketCode: reg.ticketCode || "",
        });
      }
    }

    // Update remaining waitlist positions
    const remainingWaitlist = await payload.find({
      collection: "event-registrations",
      where: {
        event: { equals: eventId },
        status: { equals: "waitlisted" },
      },
      sort: "waitlistPosition",
      limit: 1000,
    });

    for (let i = 0; i < remainingWaitlist.docs.length; i++) {
      const doc = remainingWaitlist.docs[i] as { id: string };
      await payload.update({
        collection: "event-registrations",
        id: doc.id,
        data: {
          waitlistPosition: i + 1,
        },
      });
    }

    // Send notification emails (if email service is configured)
    if (notifications.length > 0 && process.env.RESEND_API_KEY) {
      await sendPromotionEmails(notifications, event as unknown as EventDoc);
    }

    return NextResponse.json({
      success: true,
      promoted: promoted.length,
      promotedRegistrations: promoted,
      remainingWaitlist: remainingWaitlist.docs.length,
      message: `Successfully promoted ${promoted.length} registration(s) from waitlist`,
    });

  } catch (error) {
    console.error("Waitlist promotion error:", error);
    return NextResponse.json({ error: "Failed to promote from waitlist" }, { status: 500 });
  }
}

// GET - Check waitlist status and auto-promote if spots available
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Get the event
    const event = await payload.findByID({
      collection: "managed-events",
      id: eventId,
      depth: 0,
      overrideAccess: true,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const maxCapacity = (event as { maxCapacity?: number }).maxCapacity;

    // Get counts
    const [confirmed, waitlisted] = await Promise.all([
      payload.count({
        collection: "event-registrations",
        where: { event: { equals: eventId }, status: { equals: "confirmed" } },
      }),
      payload.count({
        collection: "event-registrations",
        where: { event: { equals: eventId }, status: { equals: "waitlisted" } },
      }),
    ]);

    const availableSpots = maxCapacity ? maxCapacity - confirmed.totalDocs : null;
    const canPromote = availableSpots !== null && availableSpots > 0 && waitlisted.totalDocs > 0;

    return NextResponse.json({
      eventId,
      maxCapacity,
      confirmed: confirmed.totalDocs,
      waitlisted: waitlisted.totalDocs,
      availableSpots,
      canPromote,
      promotableCount: canPromote ? Math.min(availableSpots!, waitlisted.totalDocs) : 0,
    });

  } catch (error) {
    console.error("Waitlist check error:", error);
    return NextResponse.json({ error: "Failed to check waitlist" }, { status: 500 });
  }
}

interface EventDoc {
  title?: string;
  slug?: string;
  date?: string;
}

async function sendPromotionEmails(
  notifications: Array<{ email: string; name: string; ticketCode: string }>,
  event: EventDoc
) {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pmcc4thwatch.us";

    for (const notification of notifications) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "PMCC 4th Watch <events@pmcc4thwatch.us>",
        to: notification.email,
        subject: `Good News! You're confirmed for ${event.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e3a5f;">Great News, ${notification.name}!</h1>
            <p>A spot has opened up and you have been promoted from the waitlist!</p>
            <p>You are now <strong>confirmed</strong> for <strong>${event.title}</strong>.</p>
            <p style="font-size: 1.25rem; padding: 1rem; background: #f8f6f3; border-radius: 8px; text-align: center;">
              Your ticket code: <strong>${notification.ticketCode}</strong>
            </p>
            <p>
              <a href="${baseUrl}/ticket/${notification.ticketCode}" style="display: inline-block; padding: 12px 24px; background: #c9a227; color: #1e3a5f; text-decoration: none; border-radius: 25px; font-weight: bold;">
                View Your Ticket
              </a>
            </p>
            <p>We look forward to seeing you!</p>
          </div>
        `,
      });
    }
  } catch (error) {
    console.error("Failed to send promotion emails:", error);
  }
}
