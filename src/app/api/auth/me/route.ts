import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { countDocs } from "@/lib/analytics/get-model";

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

    // Get church info
    let churchName = null;
    if (user.church) {
      try {
        const church = await payload.findByID({
          collection: "churches",
          id: user.church as string,
        });
        churchName = church?.name;
      } catch {
        // Continue without church name
      }
    }

    // Get invite statistics
    const inviteStats = await getInviteStats(payload, String(user.id));

    // Get event-specific invites for this member (future, registration-open events only)
    // Wrap in timeout so it doesn't block the whole response
    type EventInviteResult = Awaited<ReturnType<typeof getEventInvites>>;
    const eventInvites = await Promise.race([
      getEventInvites(payload, String(user.id)),
      new Promise<EventInviteResult>((resolve) => setTimeout(() => resolve([]), 5000)),
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
    // Use raw MongoDB countDocuments for count-only queries
    const [totalInvites, registered, attended, baptized] = await Promise.all([
      countDocs(payload, "event-registrations", { invitedBy: userId }),
      countDocs(payload, "event-registrations", { invitedBy: userId, status: { $in: ["registered", "attended", "baptized"] } }),
      countDocs(payload, "event-registrations", { invitedBy: userId, status: { $in: ["attended", "baptized"] } }),
      countDocs(payload, "event-registrations", { invitedBy: userId, status: "baptized" }),
    ]);

    return {
      totalInvites,
      registered,
      attended,
      baptized,
    };
  } catch {
    return {
      totalInvites: 0,
      registered: 0,
      attended: 0,
      baptized: 0,
    };
  }
}

async function getEventInvites(payload: Awaited<ReturnType<typeof getPayload>>, userId: string) {
  const t = Date.now();
  try {
    const invites = await payload.find({
      collection: "event-invites",
      where: {
        and: [
          { invitedBy: { equals: userId } },
          { status: { equals: "active" } },
        ],
      },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    });
    console.log(`[EVENT-INVITES] Got ${invites.docs.length} invites in ${Date.now() - t}ms`);

    if (invites.docs.length === 0) return [];

    // Extract event IDs and fetch events separately
    const eventIds = invites.docs
      .map((invite) => {
        const event = invite.event;
        return typeof event === "string" ? event : (event as { id?: string })?.id;
      })
      .filter(Boolean) as string[];

    const eventsResult = await payload.find({
      collection: "managed-events",
      where: {
        id: { in: eventIds },
        status: { equals: "registration-open" },
      },
      depth: 0,
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        location: true,
        status: true,
      },
      limit: 100,
      overrideAccess: true,
    });
    // Build event lookup
    const eventMap = new Map(
      eventsResult.docs.map((event) => [String(event.id), event])
    );

    // Filter to future events
    const validInvites = invites.docs.filter((invite) => {
      const eventId = typeof invite.event === "string" ? invite.event : (invite.event as { id?: string })?.id;
      const event = eventId ? eventMap.get(eventId) : undefined;
      if (!event) return false;
      const startDate = new Date(event.startDate as string);
      return startDate > new Date();
    });

    console.log(`[EVENT-INVITES] ${validInvites.length} valid invites in ${Date.now() - t}ms`);
    if (validInvites.length === 0) return [];

    // Batch: get registration counts for all invites in parallel
    const countResults = await Promise.all(
      validInvites.map((invite) =>
        countDocs(payload, "event-registrations", { eventInvite: invite.id })
      )
    );

    return validInvites.map((invite, i) => {
      const eventId = typeof invite.event === "string" ? invite.event : (invite.event as { id?: string })?.id;
      const event = eventId ? eventMap.get(eventId) : undefined;
      if (!event) return null;
      return {
        eventId: String(event.id),
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
