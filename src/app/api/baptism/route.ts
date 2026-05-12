import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit by IP: 20 requests per minute
  const clientIp = getClientIp(request);
  const { allowed, resetIn } = rateLimit(`baptism:${clientIp}`, { windowMs: 60 * 1000, maxRequests: 20 });
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
    const event = registration.event as { id?: string; title?: string; hasBaptism?: boolean } | null;

    // Check if event has baptism enabled
    if (event && event.hasBaptism === false) {
      return NextResponse.json(
        {
          success: false,
          error: "This event does not include baptism",
          code: "BAPTISM_NOT_ENABLED"
        },
        { status: 400 }
      );
    }

    // Check if already baptized
    if (registration.status === "baptized") {
      return NextResponse.json({
        success: false,
        error: "Guest already marked as baptized",
        code: "ALREADY_BAPTIZED",
        registration: {
          id: registration.id,
          guestName: registration.guestInfo?.name,
          status: registration.status,
          baptizedAt: registration.baptizedAt,
        },
      });
    }

    // Update registration to baptized
    // Also mark as attended if not already
    const updateData: {
      status: "baptized";
      baptizedAt: string;
      attendedAt?: string;
    } = {
      status: "baptized",
      baptizedAt: new Date().toISOString(),
    };

    // If guest wasn't checked in yet, also mark attendance
    if (registration.status === "registered" || registration.status === "invited") {
      updateData.attendedAt = new Date().toISOString();
    }

    const updated = await payload.update({
      collection: "event-registrations",
      id: registration.id,
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Baptism recorded successfully",
      registration: {
        id: updated.id,
        guestName: registration.guestInfo?.name,
        status: updated.status,
        attendedAt: updated.attendedAt,
        baptizedAt: updated.baptizedAt,
      },
      event: {
        id: event?.id,
        title: event?.title,
      },
    });
  } catch (error) {
    console.error("Baptism error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
