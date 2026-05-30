import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { sendRegistrationEmail } from "@/lib/email";
import { sendRegistrationSMS, getShortTicketUrl } from "@/lib/sms";
import { formatEventDate, formatEventTime } from "@/lib/event-date";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit: 50/IP/min (resends cost money, less frequent than lookups)
  const clientIp = getClientIp(request);
  const { allowed, resetIn } = await rateLimitAsync(`resend:${clientIp}`, {
    windowMs: 60 * 1000,
    maxRequests: 50,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) } }
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
    const { registrationId, method } = body as {
      registrationId?: string;
      method?: "email" | "sms" | "both";
    };

    if (!registrationId) {
      return NextResponse.json({ error: "registrationId is required" }, { status: 400 });
    }
    if (!method || !["email", "sms", "both"].includes(method)) {
      return NextResponse.json({ error: "method must be 'email', 'sms', or 'both'" }, { status: 400 });
    }

    // Lookup the registration
    const registration = await payload.findByID({
      collection: "event-registrations",
      id: registrationId,
      depth: 1,
      overrideAccess: true,
    });

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const guestInfo = registration.guestInfo as { name?: string; email?: string; phone?: string } | undefined;
    const event = registration.event as { id?: string; title?: string; startDate?: string; location?: string } | null;

    if (!guestInfo?.name) {
      return NextResponse.json({ error: "No guest info found" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "https://pmcc4thwatch.us";
    const ticketUrl = `${baseUrl}/ticket/${registration.inviteCode}`;
    const shortUrl = getShortTicketUrl(registration.inviteCode);

    const eventDate = event?.startDate
      ? `${formatEventDate(event.startDate)} at ${formatEventTime(event.startDate)}`
      : "TBD";

    const sent: string[] = [];

    // Send email
    if ((method === "email" || method === "both") && guestInfo.email) {
      const result = await sendRegistrationEmail({
        to: guestInfo.email,
        guestName: guestInfo.name,
        eventTitle: event?.title || "Upcoming Event",
        eventDate,
        eventLocation: event?.location || "TBD",
        registrationCode: registration.inviteCode,
        qrCodeUrl: registration.qrCodeUrl || "",
        ticketUrl,
      });
      if (result.success) sent.push("email");
    }

    // Send SMS
    if ((method === "sms" || method === "both") && guestInfo.phone) {
      const result = await sendRegistrationSMS({
        to: guestInfo.phone,
        guestName: guestInfo.name,
        eventTitle: event?.title || "Upcoming Event",
        ticketUrl: shortUrl,
      });
      if (result.success) sent.push("sms");
    }

    if (sent.length === 0) {
      return NextResponse.json(
        { error: "Could not send — no email/phone on file, or send failed", sent: [] },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
