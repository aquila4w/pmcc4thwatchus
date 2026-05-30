import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limit: 200/IP/min (booth staff search rapidly)
  const clientIp = getClientIp(request);
  const { allowed, resetIn } = await rateLimitAsync(`lookup:${clientIp}`, {
    windowMs: 60 * 1000,
    maxRequests: 200,
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

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const search = searchParams.get("search")?.trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }
    if (!search || search.length < 2) {
      return NextResponse.json({ error: "Search query must be at least 2 characters" }, { status: 400 });
    }

    // Search across guestInfo.name, guestInfo.email, guestInfo.phone, and inviteCode
    const results = await payload.find({
      collection: "event-registrations",
      where: {
        and: [
          { event: { equals: eventId } },
          {
            or: [
              { "guestInfo.name": { like: search } },
              { "guestInfo.email": { like: search } },
              { "guestInfo.phone": { like: search } },
              ...(search.length >= 4 ? [{ inviteCode: { equals: search.toUpperCase() } }] : []),
            ],
          },
        ],
      },
      limit,
      depth: 1,
      overrideAccess: true,
    });

    // Format results for booth display
    const docs = results.docs.map((reg) => {
      const invitedBy = reg.invitedBy as { name?: string; church?: string | { name?: string } } | null;
      let inviterChurch: string | undefined;
      if (invitedBy?.church) {
        inviterChurch = typeof invitedBy.church === "string" ? invitedBy.church : invitedBy.church.name;
      }

      return {
        id: reg.id,
        inviteCode: reg.inviteCode,
        guestInfo: reg.guestInfo,
        status: reg.status,
        sourceType: reg.sourceType,
        qrCodeUrl: reg.qrCodeUrl,
        qrCodeData: reg.qrCodeData,
        registeredAt: reg.registeredAt,
        attendedAt: reg.attendedAt,
        baptizedAt: reg.baptizedAt,
        notes: reg.notes,
        invitedBy: invitedBy ? { name: invitedBy.name, church: inviterChurch } : null,
        createdAt: reg.createdAt,
      };
    });

    return NextResponse.json({ docs, totalDocs: results.totalDocs });
  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
