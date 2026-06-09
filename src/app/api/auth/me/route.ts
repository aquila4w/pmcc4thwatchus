import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { toObjectId } from "@/lib/analytics/get-model";

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });

    // Try Payload token first (credentials login)
    const token = request.cookies.get("payload-token")?.value;
    let user = null;

    if (token) {
      const headersList = await headers();
      const authResult = await payload.auth({ headers: headersList });
      user = authResult.user;
    }

    // If no Payload token, try NextAuth session (OAuth login)
    if (!user) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        user = await payload.findByID({
          collection: "users",
          id: session.user.id,
          overrideAccess: true,
        });
      }
    }

    // Re-fetch with overrideAccess to get all own fields (e.g. inviteCode)
    if (user && token) {
      user = await payload.findByID({
        collection: "users",
        id: user.id,
        overrideAccess: true,
        depth: 0,
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const userId = String(user.id);

    // Run stats + invites + church lookup in parallel
    const [inviteStats, eventInvites, churchName] = await Promise.all([
      getInviteStats(payload, userId),
      getEventInvites(payload, userId),
      user.church
        ? payload.findByID({ collection: "churches", id: user.church as string, depth: 0, overrideAccess: true })
            .then((c) => c?.name ?? null)
            .catch(() => null)
        : null,
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        inviteCode: user.inviteCode,
        church: churchName,
        subDistrict: (user as Record<string, unknown>).subDistrict as string || null,
        forcePasswordChange: (user as Record<string, unknown>).forcePasswordChange as boolean || false,
      },
      stats: inviteStats,
      eventInvites,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
}

async function getInviteStats(payload: Awaited<ReturnType<typeof getPayload>>, userId: string) {
  try {
    // Single aggregation pipeline instead of 4 separate countDocuments queries
    const RegModel = payload.db.collections["event-registrations"];
    const result = await RegModel.aggregate([
      { $match: { invitedBy: toObjectId(userId) } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        registered: { $sum: { $cond: [{ $in: ["$status", ["registered", "attended", "baptized"]] }, 1, 0] } },
        attended: { $sum: { $cond: [{ $in: ["$status", ["attended", "baptized"]] }, 1, 0] } },
        baptized: { $sum: { $cond: [{ $eq: ["$status", "baptized"] }, 1, 0] } },
      } },
    ]);
    const s = result[0] || {};
    return { totalInvites: s.total || 0, registered: s.registered || 0, attended: s.attended || 0, baptized: s.baptized || 0 };
  } catch {
    return { totalInvites: 0, registered: 0, attended: 0, baptized: 0 };
  }
}

async function getEventInvites(payload: Awaited<ReturnType<typeof getPayload>>, userId: string) {
  try {
    const userOid = toObjectId(userId);

    // Raw Mongoose queries to bypass Payload hooks (esp. managed-events registrationCount)
    const InviteModel = payload.db.collections["event-invites"];
    const EventModel = payload.db.collections["managed-events"];

    // Fetch invites and events in parallel
    const [invites, events] = await Promise.all([
      InviteModel.find({ invitedBy: userOid, status: "active" })
        .select("event inviteCode")
        .lean(),
      EventModel.find({ status: "registration-open" })
        .select("title slug startDate location status")
        .lean(),
    ]);

    if (!invites.length) return [];

    // Build event lookup map
    const eventMap = new Map(
      events.map((e: Record<string, unknown>) => [String(e._id), e])
    );

    // Filter to future events
    const now = new Date();
    const validInvites = invites.filter((invite: Record<string, unknown>) => {
      const eventId = String(invite.event);
      const event = eventMap.get(eventId);
      if (!event) return false;
      return new Date(event.startDate as string) > now;
    });

    if (!validInvites.length) return [];

    // Single aggregation to get registration counts for ALL invites at once
    const RegModel = payload.db.collections["event-registrations"];
    const inviteIds = validInvites.map((inv: Record<string, unknown>) => inv._id);
    const regCounts = await RegModel.aggregate([
      { $match: { eventInvite: { $in: inviteIds } } },
      { $group: { _id: "$eventInvite", count: { $sum: 1 } } },
    ]);
    const regMap = new Map(regCounts.map((r: { _id: unknown; count: number }) => [String(r._id), r.count]));

    return validInvites.map((invite: Record<string, unknown>) => {
      const eventId = String(invite.event);
      const event = eventMap.get(eventId);
      if (!event) return null;
      return {
        eventId,
        eventTitle: event.title as string,
        eventSlug: event.slug as string,
        eventDate: event.startDate as string,
        eventLocation: event.location as string,
        inviteCode: invite.inviteCode as string,
        registrationCount: regMap.get(String(invite._id)) || 0,
      };
    }).filter(Boolean) as Array<{
      eventId: string; eventTitle: string; eventSlug: string;
      eventDate: string; eventLocation: string; inviteCode: string;
      registrationCount: number;
    }>;
  } catch (error) {
    console.error("[EVENT-INVITES] Error:", error);
    return [];
  }
}
