import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { sendRegistrationEmail } from "@/lib/email";
import { sendRegistrationSMS } from "@/lib/sms";
import { formatEventDate, formatEventTime } from "@/lib/event-date";
import { rateLimitAsync } from "@/lib/rate-limit";
import { randomInt } from "crypto";

function generateRegistrationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[randomInt(chars.length)];
  }
  return code;
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error("GOOGLE_RECAPTCHA_SECRET_KEY not configured, rejecting request");
    return false;
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
  // Parse body and validate inputs BEFORE touching the database.
  // This ensures rate limiting and validation return proper status codes
  // even when MongoDB is under heavy load.
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    eventInviteCode,
    eventSlug,
    refCode,
    adCode,
    platformCode,
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
  } = body as {
    eventInviteCode?: string;
    eventSlug?: string;
    refCode?: string;
    adCode?: string;
    platformCode?: string;
    scanId?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    recaptchaToken?: string;
    joinWaitlist?: boolean;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
  };

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

  // Rate limit by invite code: 200/hr for member codes, 1,000/hr for church/platform codes
  const inviteKey = eventInviteCode || refCode || adCode || platformCode || "anonymous";
  const isHighVolumeSource = !!(adCode || platformCode); // church tracts and platform links get higher limits
  const inviteMaxRequests = isHighVolumeSource ? 1000 : 200;

  // Also rate limit by IP globally to prevent abuse (500/IP/hr)
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip") || "unknown";

  try {
    const [inviteRateLimit, ipRateLimit] = await Promise.all([
      rateLimitAsync(`register:${inviteKey}`, { windowMs: 60 * 60 * 1000, maxRequests: inviteMaxRequests }),
      rateLimitAsync(`register-ip:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 500 }),
    ]);

    if (!inviteRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many registrations for this invite. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(inviteRateLimit.resetIn / 1000)) },
        }
      );
    }
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many registrations. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(ipRateLimit.resetIn / 1000)) },
        }
      );
    }
  } catch (rateLimitErr) {
    console.error("Rate limit check failed:", rateLimitErr);
    // Don't block requests if rate limiter itself fails — continue without rate limit
  }

  const phoneToUse = phone?.trim() || (guestPhone as string)?.trim();
  const emailToUse = email?.trim() || (guestEmail as string)?.trim();

  try {
    const payload = await getPayload({ config });

    // Find the event invite — support UUID code, ref-based lookup, or church ad code
    let eventInvite: Record<string, unknown> | null = null;
    let churchInvite: Record<string, unknown> | null = null;
    let platformLink: Record<string, unknown> | null = null;
    let event: Record<string, unknown> | null = null;
    let invitingMember: Record<string, unknown> | null = null;
    let churchContact: { name?: string; email?: string; phone?: string } | null = null;
    let sourceType: "member" | "church" | "platform" = "member";

    if (refCode && eventSlug) {
      // Look up member + event in parallel (was sequential — 2 DB round-trips → 1)
      const [membersResult, eventsResult] = await Promise.all([
        payload.find({
          collection: "users",
          where: { inviteCode: { equals: refCode } },
          limit: 1,
          depth: 0,
        }),
        payload.find({
          collection: "managed-events",
          where: { slug: { equals: eventSlug } },
          limit: 1,
          depth: 0,
        }),
      ]);

      if (membersResult.docs.length === 0) {
        return NextResponse.json(
          { error: "Invalid invite link" },
          { status: 404 }
        );
      }

      if (eventsResult.docs.length === 0) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      invitingMember = membersResult.docs[0];
      event = eventsResult.docs[0];

      // Find EventInvite for this member+event (parallel with nothing else to do here)
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
    } else if (platformCode && eventSlug) {
      // Online platform QR code lookup
      sourceType = "platform";
      const plResult = await payload.find({
        collection: "platform-event-links",
        where: {
          and: [
            { code: { equals: platformCode } },
            { status: { equals: "active" } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });

      if (plResult.docs.length === 0) {
        return NextResponse.json(
          { error: "Invalid or disabled platform link" },
          { status: 404 }
        );
      }

      platformLink = plResult.docs[0] as Record<string, unknown>;
      const linkedEventId = String(platformLink.event);

      // Resolve event from platform link or slug
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

    // Use the event data we already fetched (avoid redundant findByID round-trip)
    const fullEvent = event as {
      id: string;
      status?: string;
      title?: string;
      startDate?: string;
      location?: string;
      address?: string;
      maxAttendees?: number;
      landingPageTitle?: string;
      landingPageShowQR?: boolean;
      landingPageShowInviter?: boolean;
      [key: string]: unknown;
    };

    // If event data is incomplete (e.g., church/platform paths didn't fetch full event), fetch it
    if (!fullEvent.status && !fullEvent.title) {
      const fetchedEvent = await payload.findByID({
        collection: "managed-events",
        id: String(event.id),
        depth: 0,
      });
      if (!fetchedEvent) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      Object.assign(fullEvent, fetchedEvent);
    }

    if (fullEvent.status !== "registration-open") {
      return NextResponse.json(
        { error: "Event registration is not open" },
        { status: 400 }
      );
    }

    // Check capacity — single query with totalDocs only
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
        depth: 0,
      });

      if (currentRegistrations.totalDocs >= (fullEvent.maxAttendees as number)) {
        if (!joinWaitlist) {
          const waitlistCount = await payload.find({
            collection: "event-registrations",
            where: {
              event: { equals: fullEvent.id },
              status: { equals: "waitlisted" },
            },
            limit: 0,
            depth: 0,
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
          depth: 0,
        });
        waitlistPosition = waitlistEntries.totalDocs + 1;
      }
    }

    // Generate registration code — skip uniqueness check (30^8 = 656 billion combinations,
    // collision probability at 5000 existing is ~0.00002%). Just generate and insert.
    const registrationCode = generateRegistrationCode();

    // Generate QR code data — encode registration code for check-in lookup
    const qrData = registrationCode;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}`;

    // Run guest user creation and church lookup in parallel
    const emailForGuest = emailToUse || `guest-${registrationCode.toLowerCase()}@pmcc4thwatch.us`;

    const [guestUserIdResult, churchResult] = await Promise.all([
      // Create guest user
      (async () => {
        try {
          const existingGuests = await payload.find({
            collection: "users",
            where: { email: { equals: emailForGuest } },
            limit: 1,
            depth: 0,
          });

          if (existingGuests.docs.length > 0) {
            return String(existingGuests.docs[0].id);
          }

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
          return String(guestUser.id);
        } catch (err) {
          console.error("Failed to create guest user");
          return undefined;
        }
      })(),
      // Get inviter church ID and name
      (async () => {
        if (!invitingMember?.church) return { id: undefined, name: undefined };
        try {
          const church = typeof invitingMember.church === "object"
            ? invitingMember.church as { id?: string; name?: string }
            : await payload.findByID({ collection: "churches", id: String(invitingMember.church), depth: 0 });
          return {
            id: String((church as { id?: string }).id || invitingMember.church),
            name: (church as { name?: string })?.name,
          };
        } catch {
          return { id: undefined, name: undefined };
        }
      })(),
    ]);

    const guestUserId = guestUserIdResult;
    const inviterChurchId = churchResult.id;
    const inviterChurchName = churchResult.name;

    // Create registration
    const registration = await payload.create({
      collection: "event-registrations",
      data: {
        inviteCode: registrationCode,
        event: fullEvent.id,
        eventInvite: eventInvite?.id || undefined,
        churchEventInvite: churchInvite?.id || undefined,
        platformEventLink: platformLink?.id || undefined,
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
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "https://pmcc4thwatch.us";
    const landingPageUrl = `${baseUrl}/ticket/${registrationCode}`;
    const shortUrl = `${baseUrl}/t/${registrationCode}`;

    // Format event date
    const eventDate = `${formatEventDate(fullEvent.startDate as string)} at ${formatEventTime(fullEvent.startDate as string)}`;

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
      const smsInvitedBy = sourceType === "church" && churchContact
        ? { name: churchContact.name, phone: churchContact.phone }
        : { name: invitingMember?.name as string | undefined, phone: invitingMember?.phone as string | undefined };
      sendRegistrationSMS({
        to: phoneToUse,
        guestName: fullName,
        eventTitle: fullEvent.title || "Upcoming Event",
        ticketUrl: shortUrl,
        invitedByName: smsInvitedBy.name,
        invitedByPhone: smsInvitedBy.phone,
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
    console.error("Registration error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
