import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { countDocs, toObjectId } from "@/lib/analytics/get-model";

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
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
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
      },
      stats: inviteStats,
      eventInvites,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}

async function getInviteStats(payload: Awaited<ReturnType<typeof getPayload>>, userId: string) {
  try {
    const userOid = toObjectId(userId);
    const [totalInvites, registered, attended, baptized] = await Promise.all([
      countDocs(payload, "event-registrations", { invitedBy: userOid }),
      countDocs(payload, "event-registrations", { invitedBy: userOid, status: { $in: ["registered", "attended", "baptized"] } }),
      countDocs(payload, "event-registrations", { invitedBy: userOid, status: { $in: ["attended", "baptized"] } }),
      countDocs(payload, "event-registrations", { invitedBy: userOid, status: "baptized" }),
    ]);

    return { totalInvites, registered, attended, baptized };
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

    // Batch: get registration counts for all valid invites in parallel
    const RegModel = payload.db.collections["event-registrations"];
    const countResults = await Promise.all(
      validInvites.map((invite: Record<string, unknown>) =>
        RegModel.countDocuments({ eventInvite: invite._id })
      )
    );

    return validInvites.map((invite: Record<string, unknown>, i: number) => {
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
        registrationCount: countResults[i],
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
