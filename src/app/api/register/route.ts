import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { sendRegistrationEmail } from "@/lib/email";
import { sendRegistrationSMS, shortenUrl } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const body = await request.json();

    const { eventSlug, memberInviteCode, guestName, guestEmail, guestPhone, joinWaitlist } = body;

    // Validate required fields
    if (!eventSlug || !memberInviteCode || !guestName) {
      return NextResponse.json(
        { error: "Missing required fields: eventSlug, memberInviteCode, guestName" },
        { status: 400 }
      );
    }

    // Find the event by slug
    const events = await payload.find({
      collection: "managed-events",
      where: {
        slug: { equals: eventSlug },
        status: { equals: "registration-open" },
      },
      limit: 1,
    });

    if (events.docs.length === 0) {
      return NextResponse.json(
        { error: "Event not found or registration is closed" },
        { status: 404 }
      );
    }

    const event = events.docs[0];

    // Check capacity and determine if waitlist
    let isWaitlisted = false;
    let waitlistPosition = 0;

    if (event.maxAttendees) {
      const currentRegistrations = await payload.find({
        collection: "event-registrations",
        where: {
          event: { equals: event.id },
          status: { in: ["registered", "confirmed", "attended", "baptized"] },
        },
        limit: 0,
      });

      if (currentRegistrations.totalDocs >= event.maxAttendees) {
        if (!joinWaitlist) {
          // Return capacity info so frontend can offer waitlist option
          const waitlistCount = await payload.find({
            collection: "event-registrations",
            where: {
              event: { equals: event.id },
              status: { equals: "waitlisted" },
            },
            limit: 0,
          });

          return NextResponse.json(
            {
              error: "Event has reached maximum capacity",
              capacityReached: true,
              waitlistCount: waitlistCount.totalDocs,
              canJoinWaitlist: true,
            },
            { status: 400 }
          );
        }

        // User wants to join waitlist
        isWaitlisted = true;
        const waitlistEntries = await payload.find({
          collection: "event-registrations",
          where: {
            event: { equals: event.id },
            status: { equals: "waitlisted" },
          },
          limit: 0,
        });
        waitlistPosition = waitlistEntries.totalDocs + 1;
      }
    }

    // Find the inviting member by invite code
    const members = await payload.find({
      collection: "users",
      where: {
        inviteCode: { equals: memberInviteCode },
      },
      limit: 1,
    });

    if (members.docs.length === 0) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 }
      );
    }

    const invitingMember = members.docs[0];

    // Generate unique registration code
    const registrationCode = generateRegistrationCode();

    // Generate QR code data
    const qrData = JSON.stringify({
      code: registrationCode,
      eventId: event.id,
      guestName: guestName,
    });

    // Generate QR code URL using external service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}`;

    // Create the registration
    const registration = await payload.create({
      collection: "event-registrations",
      data: {
        inviteCode: registrationCode,
        event: event.id,
        invitedBy: invitingMember.id,
        invitedByChurch: invitingMember.church || undefined,
        guestInfo: {
          name: guestName,
          email: guestEmail || undefined,
          phone: guestPhone || undefined,
        },
        qrCodeUrl: qrCodeUrl,
        qrCodeData: qrData,
        status: isWaitlisted ? "waitlisted" : "registered",
        waitlistPosition: isWaitlisted ? waitlistPosition : undefined,
        registeredAt: new Date().toISOString(),
      },
    });

    // Generate ticket page URL
    const baseUrl = request.headers.get("origin") || "https://pmcc4thwatch.us";
    const ticketUrl = `${baseUrl}/ticket/${registrationCode}`;

    // Format event date for notifications
    const eventDate = new Date(event.startDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    // Send email if guestEmail provided
    if (guestEmail) {
      sendRegistrationEmail({
        to: guestEmail,
        guestName: guestName,
        eventTitle: event.title,
        eventDate: eventDate,
        eventLocation: event.location || "TBD",
        registrationCode: registrationCode,
        qrCodeUrl: qrCodeUrl,
        ticketUrl: ticketUrl,
        invitedByName: invitingMember.name,
      }).catch((err) => console.error("Email send failed:", err));
    }

    // Send SMS with shortened ticket URL if guestPhone provided
    if (guestPhone) {
      shortenUrl(ticketUrl).then((shortUrl) => {
        sendRegistrationSMS({
          to: guestPhone,
          guestName: guestName,
          eventTitle: event.title,
          ticketUrl: shortUrl,
        }).catch((err) => console.error("SMS send failed:", err));
      });
    }

    return NextResponse.json({
      success: true,
      isWaitlisted,
      waitlistPosition: isWaitlisted ? waitlistPosition : undefined,
      registration: {
        id: registration.id,
        code: registrationCode,
        qrCodeUrl: qrCodeUrl,
        ticketUrl: ticketUrl,
        status: isWaitlisted ? "waitlisted" : "registered",
      },
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        location: event.location,
        address: event.address,
      },
      invitedBy: {
        name: invitingMember.name,
        phone: invitingMember.phone,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Generate a readable registration code
function generateRegistrationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
