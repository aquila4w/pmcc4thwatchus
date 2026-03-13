import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { sendRegistrationEmail } from "@/lib/email";
import { sendRegistrationSMS, shortenUrl } from "@/lib/sms";

// Generate a readable registration code
function generateRegistrationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const body = await request.json();

    const { eventInviteCode, guestName, guestEmail, guestPhone, joinWaitlist } = body;

    // Validate required fields
    if (!eventInviteCode || !guestName) {
      return NextResponse.json(
        { error: "Missing required fields: eventInviteCode, guestName" },
        { status: 400 }
      );
    }

    // Find the event invite by UUID code
    const invites = await payload.find({
      collection: "event-invites",
      where: {
        and: [
          { inviteCode: { equals: eventInviteCode } },
          { status: { equals: "active" } },
        ],
      },
      limit: 1,
      depth: 2, // Include event and invitedBy
    });

    if (invites.docs.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired invite link" },
        { status: 404 }
      );
    }

    const eventInvite = invites.docs[0];
    const event = eventInvite.event as {
      id?: string;
      title?: string;
      slug?: string;
      description?: string;
      startDate?: string;
      location?: string;
      address?: string;
      maxAttendees?: number;
      hasBaptism?: boolean;
      landingPageTitle?: string;
      landingPageShowQR?: boolean;
      landingPageShowInviter?: boolean;
    } | null;

    const invitingMember = eventInvite.invitedBy as {
      id?: string;
      name?: string;
      phone?: string;
      email?: string;
      church?: { id?: string; name?: string };
    } | null;

    if (!event?.id) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if event is open for registration
    const fullEvent = await payload.findByID({
      collection: "managed-events",
      id: event.id,
    });

    if (fullEvent?.status !== "registration-open") {
      return NextResponse.json(
        { error: "Event registration is not open" },
        { status: 400 }
      );
    }

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

    // Create guest user account first
    let guestUserId;
    const emailToUse = guestEmail || `guest-${registrationCode.toLowerCase()}@pmcc4thwatch.us`;

    try {
      // Check if guest already exists with this email
      const existingGuests = await payload.find({
        collection: "users",
        where: {
          email: { equals: emailToUse },
        },
        limit: 1,
      });

      if (existingGuests.docs.length > 0) {
        // Use existing guest user
        guestUserId = existingGuests.docs[0].id;
      } else {
        // Create new guest user
        const guestUser = await payload.create({
          collection: "users",
          data: {
            name: guestName,
            email: emailToUse,
            phone: guestPhone || undefined,
            role: "guest",
            status: "approved",
            authProvider: "event-registration",
            // No password - guest users cannot login via credentials
          },
          depth: 0,
        });
        guestUserId = guestUser.id;
      }
    } catch (guestError) {
      console.error("Failed to create guest user:", guestError);
      // Continue without guest user - non-fatal
    }

    // Create the registration
    const registration = await payload.create({
      collection: "event-registrations",
      data: {
        inviteCode: registrationCode,
        event: event.id,
        eventInvite: eventInvite.id, // Link to the EventInvite
        invitedBy: invitingMember?.id,
        invitedByChurch: invitingMember?.church || undefined,
        guest: guestUserId, // Link to guest user
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

    // Generate landing page URL
    const baseUrl = request.headers.get("origin") || "https://pmcc4thwatch.us";
    const landingPageUrl = `${baseUrl}/event/${event.id}/welcome/${registrationCode}`;

    // Format event date for notifications
    const eventDate = new Date(event.startDate || Date.now()).toLocaleDateString("en-US", {
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
        eventTitle: event.title || "Upcoming Event",
        eventDate: eventDate,
        eventLocation: event.location || "TBD",
        registrationCode: registrationCode,
        qrCodeUrl: qrCodeUrl,
        ticketUrl: landingPageUrl,
        invitedByName: invitingMember?.name,
      }).catch((err) => console.error("Email send failed:", err));
    }

    // Send SMS with shortened landing page URL if guestPhone provided
    if (guestPhone) {
      shortenUrl(landingPageUrl).then((shortUrl) => {
        sendRegistrationSMS({
          to: guestPhone,
          guestName: guestName,
          eventTitle: event.title || "Upcoming Event",
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
        landingPageUrl: landingPageUrl,
        ticketUrl: landingPageUrl, // Keep for backward compatibility
        status: isWaitlisted ? "waitlisted" : "registered",
      },
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        location: event.location,
        address: event.address,
        landingPage: {
          title: fullEvent?.landingPageTitle || "You're Registered!",
          showQR: fullEvent?.landingPageShowQR ?? true,
          showInviter: fullEvent?.landingPageShowInviter ?? true,
        },
      },
      invitedBy: {
        name: invitingMember?.name,
        phone: invitingMember?.phone,
        email: invitingMember?.email,
        church: invitingMember?.church?.name,
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
