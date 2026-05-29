import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit by IP: 20 requests per minute
  const clientIp = getClientIp(request);
  const { allowed, resetIn } = rateLimit(`check-in:${clientIp}`, { windowMs: 60 * 1000, maxRequests: 20 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      }
    );
  }

  try {
    const payload = await getPayload({ config });

    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();

    const { registrationCode, eventId } = body;

    if (!registrationCode) {
      return NextResponse.json(
        { error: "Missing registration code" },
        { status: 400 }
      );
    }

    // Find the registration
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        inviteCode: { equals: registrationCode.toUpperCase() },
        ...(eventId ? { event: { equals: eventId } } : {}),
      },
      limit: 1,
      depth: 2,
      overrideAccess: true,
    });

    if (registrations.docs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration not found",
          code: "NOT_FOUND"
        },
        { status: 404 }
      );
    }

    const registration = registrations.docs[0];

    // Check if already checked in
    if (registration.status === "attended" || registration.status === "baptized") {
      return NextResponse.json({
        success: false,
        error: "Guest already checked in",
        code: "ALREADY_CHECKED_IN",
        registration: {
          id: registration.id,
          guestName: registration.guestInfo?.name,
          status: registration.status,
          attendedAt: registration.attendedAt,
        },
      });
    }

    // Check if event allows check-in
    const event = registration.event as { id?: string; title?: string; hasBaptism?: boolean; checkInEnabled?: boolean } | null;
    if (event && event.checkInEnabled === false) {
      return NextResponse.json(
        {
          success: false,
          error: "Check-in is not enabled for this event",
          code: "CHECK_IN_DISABLED"
        },
        { status: 400 }
      );
    }

    // Update registration to attended
    const updated = await payload.update({
      collection: "event-registrations",
      id: registration.id,
      data: {
        status: "attended",
        attendedAt: new Date().toISOString(),
        // checkedInBy could be set if we have authenticated user
      },
    });

    const invitedBy = registration.invitedBy as { name?: string; church?: string | { name?: string } } | null;
    let inviterChurch: string | undefined;
    if (invitedBy?.church) {
      inviterChurch = typeof invitedBy.church === "string" ? invitedBy.church : invitedBy.church.name;
    }

    return NextResponse.json({
      success: true,
      message: "Check-in successful",
      registration: {
        id: updated.id,
        guestName: registration.guestInfo?.name,
        status: updated.status,
        attendedAt: updated.attendedAt,
        invitedBy: invitedBy ? {
          name: invitedBy.name,
          church: inviterChurch,
        } : null,
      },
      event: {
        id: event?.id,
        title: event?.title,
        hasBaptism: event?.hasBaptism,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to lookup a registration without checking in
export async function GET(request: NextRequest) {
  // Rate limit by IP: 20 requests per minute
  const clientIp = getClientIp(request);
  const { allowed, resetIn } = rateLimit(`check-in-get:${clientIp}`, { windowMs: 60 * 1000, maxRequests: 20 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      }
    );
  }

  try {
    const payload = await getPayload({ config });

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Missing code parameter" },
        { status: 400 }
      );
    }

    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        inviteCode: { equals: code.toUpperCase() },
      },
      limit: 1,
      depth: 2,
      overrideAccess: true,
    });

    if (registrations.docs.length === 0) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    const registration = registrations.docs[0];
    const event = registration.event as { id?: string; title?: string; startDate?: string; location?: string; hasBaptism?: boolean } | null;
    const invitedBy = registration.invitedBy as { name?: string; phone?: string; email?: string; church?: string | { name?: string } } | null;

    // Resolve church name
    let inviterChurch: string | undefined;
    if (invitedBy?.church) {
      inviterChurch = typeof invitedBy.church === "string" ? invitedBy.church : invitedBy.church.name;
    }

    return NextResponse.json({
      registration: {
        id: registration.id,
        code: registration.inviteCode,
        guestName: registration.guestInfo?.name,
        guestEmail: registration.guestInfo?.email,
        guestPhone: registration.guestInfo?.phone,
        status: registration.status,
        sourceType: registration.sourceType,
        registeredAt: registration.registeredAt,
        attendedAt: registration.attendedAt,
        baptizedAt: registration.baptizedAt,
      },
      event: {
        id: event?.id,
        title: event?.title,
        startDate: event?.startDate,
        location: event?.location,
        hasBaptism: event?.hasBaptism,
      },
      invitedBy: invitedBy ? {
        name: invitedBy.name,
        phone: invitedBy.phone,
        email: invitedBy.email,
        church: inviterChurch,
      } : null,
    });
  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
