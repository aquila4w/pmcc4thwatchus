import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { sendRegistrationEmail } from "@/lib/email";
import { sendRegistrationSMS } from "@/lib/sms";

function generateRegistrationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.warn("GOOGLE_RECAPTCHA_SECRET_KEY not set, skipping verification");
    return true;
  }

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
      }
    );
    const data = await response.json();
    return data.success === true;
  } catch {
    console.error("reCAPTCHA verification failed");
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const body = await request.json();

    const {
      eventInviteCode,
      eventSlug,
      refCode,
      adCode,
      scanId,
      firstName,
      lastName,
      phone,
      email,
      recaptchaToken,
      joinWaitlist,
      // Legacy support
      guestName,
      guestEmail,
      guestPhone,
    } = body;

    // Determine name fields (support both new and legacy format)
    const fName = firstName?.trim();
    const lName = lastName?.trim();
    const fullName = fName && lName ? `${fName} ${lName}` : guestName?.trim();

    if (!fullName) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!phone && !guestPhone) {
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const isValid = await verifyRecaptcha(recaptchaToken);
      if (!isValid) {
        return NextResponse.json(
          { error: "Captcha verification failed. Please try again." },
          { status: 400 }
        );
      }
    }

    const phoneToUse = phone?.trim() || guestPhone?.trim();
    const emailToUse = email?.trim() || guestEmail?.trim();

    // Find the event invite — support UUID code, ref-based lookup, or church ad code
    let eventInvite: Record<string, unknown> | null = null;
    let churchInvite: Record<string, unknown> | null = null;
    let event: Record<string, unknown> | null = null;
    let invitingMember: Record<string, unknown> | null = null;
    let churchContact: { name?: string; email?: string; phone?: string } | null = null;
    let sourceType: "member" | "church" = "member";

    if (refCode && eventSlug) {
      // Look up by member code + event slug
      const members = await payload.find({
        collection: "users",
        where: { inviteCode: { equals: refCode } },
        limit: 1,
        depth: 0,
      });

      if (members.docs.length === 0) {
        return NextResponse.json(
          { error: "Invalid invite link" },
          { status: 404 }
        );
      }

      invitingMember = members.docs[0];

      const events = await payload.find({
        collection: "managed-events",
        where: { slug: { equals: eventSlug } },
        limit: 1,
        depth: 0,
      });

      if (events.docs.length === 0) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      event = events.docs[0];

      // Find or create EventInvite for this member+event
      const existingInvites = await payload.find({
        collection: "event-invites",
        where: {
          and: [
            { event: { equals: event.id } },
            { invitedBy: { equals: invitingMember.id } },
          ],
        },
        limit: 1,
        depth: 0,
      });

      if (existingInvites.docs.length > 0) {
        eventInvite = existingInvites.docs[0];
      }
      // If no invite exists, we still allow registration (member may not have been auto-generated)
    } else if (eventInviteCode) {
      // Legacy: look up by EventInvite UUID code
      const invites = await payload.find({
        collection: "event-invites",
        where: {
          and: [
            { inviteCode: { equals: eventInviteCode } },
            { status: { equals: "active" } },
          ],
        },
        limit: 1,
        depth: 2,
      });

      if (invites.docs.length === 0) {
        return NextResponse.json(
          { error: "Invalid or expired invite link" },
          { status: 404 }
        );
      }

      eventInvite = invites.docs[0] as Record<string, unknown>;
      event = eventInvite.event as Record<string, unknown>;
      invitingMember = eventInvite.invitedBy as Record<string, unknown>;
    } else if (adCode) {
      // Church ad QR code lookup
      sourceType = "church";
      const ciResult = await payload.find({
        collection: "church-event-invites",
        where: {
          and: [
            { code: { equals: adCode } },
            { status: { equals: "active" } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });

      if (ciResult.docs.length === 0) {
        return NextResponse.json(
          { error: "Invalid or disabled church invite code" },
          { status: 404 }
        );
      }

      churchInvite = ciResult.docs[0] as Record<string, unknown>;
      event = { id: churchInvite.event } as Record<string, unknown>;

      // Resolve contact info from the church invite
      churchContact = {
        name: (churchInvite.contactName as string) || undefined,
        email: (churchInvite.contactEmail as string) || undefined,
        phone: (churchInvite.contactPhone as string) || undefined,
      };
    } else {
      return NextResponse.json(
        { error: "Missing invite reference" },
        { status: 400 }
      );
    }

    if (!event?.id) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Get full event data
    const fullEvent = await payload.findByID({
      collection: "managed-events",
      id: String(event.id),
    });

    if (fullEvent?.status !== "registration-open") {
      return NextResponse.json(
        { error: "Event registration is not open" },
        { status: 400 }
      );
    }

    // Check capacity
    let isWaitlisted = false;
    let waitlistPosition = 0;

    if (fullEvent.maxAttendees) {
      const currentRegistrations = await payload.find({
        collection: "event-registrations",
        where: {
          event: { equals: fullEvent.id },
          status: { in: ["registered", "confirmed", "attended", "baptized"] },
        },
        limit: 0,
      });

      if (currentRegistrations.totalDocs >= fullEvent.maxAttendees) {
        if (!joinWaitlist) {
          const waitlistCount = await payload.find({
            collection: "event-registrations",
            where: {
              event: { equals: fullEvent.id },
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

        isWaitlisted = true;
        const waitlistEntries = await payload.find({
          collection: "event-registrations",
          where: {
            event: { equals: fullEvent.id },
            status: { equals: "waitlisted" },
          },
          limit: 0,
        });
        waitlistPosition = waitlistEntries.totalDocs + 1;
      }
    }

    // Generate registration code (with uniqueness check)
    let registrationCode = generateRegistrationCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await payload.find({
        collection: "event-registrations",
        where: { inviteCode: { equals: registrationCode } },
        limit: 1,
        depth: 0,
      });
      if (existing.totalDocs === 0) break;
      registrationCode = generateRegistrationCode();
      if (attempt === 4) {
        // Final attempt — verify the last generated code
        const finalCheck = await payload.find({
          collection: "event-registrations",
          where: { inviteCode: { equals: registrationCode } },
          limit: 1,
          depth: 0,
        });
        if (finalCheck.totalDocs > 0) {
          return NextResponse.json(
            { error: "Failed to generate unique registration code. Please try again." },
            { status: 500 },
          );
        }
      }
    }

    // Generate QR code data — encode registration code for check-in lookup
    const qrData = registrationCode;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}`;

    // Create guest user
    let guestUserId: string | undefined;
    const emailForGuest = emailToUse || `guest-${registrationCode.toLowerCase()}@pmcc4thwatch.us`;

    try {
      const existingGuests = await payload.find({
        collection: "users",
        where: { email: { equals: emailForGuest } },
        limit: 1,
      });

      if (existingGuests.docs.length > 0) {
        guestUserId = String(existingGuests.docs[0].id);
      } else {
        const guestUser = await payload.create({
          collection: "users",
          data: {
            name: fullName,
            email: emailForGuest,
            phone: phoneToUse || undefined,
            role: "guest",
            status: "approved",
            authProvider: "event-registration",
          },
          depth: 0,
        });
        guestUserId = String(guestUser.id);
      }
    } catch (err) {
      console.error("Failed to create guest user:", err);
    }

    // Get inviter church ID and name
    let inviterChurchId: string | undefined;
    let inviterChurchName: string | undefined;
    if (invitingMember?.church) {
      try {
        const church = typeof invitingMember.church === "object"
          ? invitingMember.church as { id?: string; name?: string }
          : await payload.findByID({ collection: "churches", id: String(invitingMember.church) });
        inviterChurchId = String((church as { id?: string }).id || invitingMember.church);
        inviterChurchName = (church as { name?: string })?.name;
      } catch {}
    }

    // Create registration
    const registration = await payload.create({
      collection: "event-registrations",
      data: {
        inviteCode: registrationCode,
        event: fullEvent.id,
        eventInvite: eventInvite?.id || undefined,
        churchEventInvite: churchInvite?.id || undefined,
        sourceType,
        invitedBy: invitingMember?.id,
        invitedByChurch: inviterChurchId || undefined,
        guest: guestUserId,
        guestInfo: {
          name: fullName,
          email: emailToUse || undefined,
          phone: phoneToUse || undefined,
        },
        qrCodeUrl,
        qrCodeData: qrData,
        status: isWaitlisted ? "waitlisted" : "registered",
        waitlistPosition: isWaitlisted ? waitlistPosition : undefined,
        registeredAt: new Date().toISOString(),
      },
    });

    // Build URLs
    const baseUrl = request.headers.get("origin") || "https://pmcc4thwatch.us";
    const landingPageUrl = `${baseUrl}/ticket/${registrationCode}`;
    const shortUrl = `${baseUrl}/t/${registrationCode}`;

    // Format event date
    const eventDate = new Date(fullEvent.startDate).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });

    // Send email
    if (emailToUse) {
      sendRegistrationEmail({
        to: emailToUse,
        guestName: fullName,
        eventTitle: fullEvent.title || "Upcoming Event",
        eventDate,
        eventLocation: fullEvent.location || "TBD",
        registrationCode,
        qrCodeUrl,
        ticketUrl: landingPageUrl,
        invitedByName: invitingMember?.name as string | undefined,
        invitedByPhone: invitingMember?.phone as string | undefined,
        invitedByEmail: invitingMember?.email as string | undefined,
        invitedByChurch: inviterChurchName,
      }).catch((err) => console.error("Email send failed:", err));
    }

    // Send SMS
    if (phoneToUse) {
      sendRegistrationSMS({
        to: phoneToUse,
        guestName: fullName,
        eventTitle: fullEvent.title || "Upcoming Event",
        ticketUrl: shortUrl,
      }).catch((err) => console.error("SMS send failed:", err));
    }

    // Update invite scan record if scanId provided
    if (scanId) {
      try {
        const scanUpdate: Record<string, unknown> = {
          registered: true,
          registration: registration.id,
          registeredAt: new Date().toISOString(),
        };
        if (body.timeOnPage !== undefined) scanUpdate.timeOnPage = body.timeOnPage;
        if (body.formStartDelay !== undefined) scanUpdate.formStartDelay = body.formStartDelay;
        if (body.scrollDepth !== undefined) scanUpdate.scrollDepth = body.scrollDepth;
        if (body.rageClickDetected !== undefined) scanUpdate.rageClickDetected = body.rageClickDetected;

        await payload.update({
          collection: "invite-scans",
          id: scanId,
          data: scanUpdate,
          depth: 0,
          overrideAccess: true,
        });
      } catch {
        // Non-critical — scan update failure shouldn't fail registration
      }
    }

    // Determine "invited by" display info
    const invitedByDisplay = sourceType === "church" && churchContact
      ? {
          name: churchContact.name || null,
          phone: churchContact.phone || null,
          email: churchContact.email || null,
          church: null,
        }
      : {
          name: invitingMember?.name,
          phone: invitingMember?.phone,
          email: invitingMember?.email,
          church: inviterChurchName,
        };

    return NextResponse.json({
      success: true,
      isWaitlisted,
      waitlistPosition: isWaitlisted ? waitlistPosition : undefined,
      registration: {
        id: registration.id,
        code: registrationCode,
        qrCodeUrl,
        landingPageUrl,
        ticketUrl: landingPageUrl,
        status: isWaitlisted ? "waitlisted" : "registered",
      },
      event: {
        id: fullEvent.id,
        title: fullEvent.title,
        startDate: fullEvent.startDate,
        location: fullEvent.location,
        address: fullEvent.address,
        landingPage: {
          title: fullEvent.landingPageTitle || "You're Registered!",
          showQR: fullEvent.landingPageShowQR ?? true,
          showInviter: fullEvent.landingPageShowInviter ?? true,
        },
      },
      invitedBy: invitedByDisplay,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
