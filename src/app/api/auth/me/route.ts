import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log(`[AUTH/ME] Starting at ${new Date().toISOString()}`);
    const payload = await getPayload({ config });
    console.log(`[AUTH/ME] Payload initialized in ${Date.now() - startTime}ms`);

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
    console.log(`[AUTH/ME] Stats loaded at ${Date.now() - startTime}ms`);

    // Get event-specific invites for this member (future, registration-open events only)
    const eventInvites = await getEventInvites(payload, String(user.id));
    console.log(`[AUTH/ME] Event invites loaded at ${Date.now() - startTime}ms`);

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
    // Use limit: 0 to just get totalDocs count without fetching all documents
    const [totalRes, registeredRes, attendedRes, baptizedRes] = await Promise.all([
      payload.find({
        collection: "event-registrations",
        where: { invitedBy: { equals: userId } },
        limit: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: "event-registrations",
        where: { invitedBy: { equals: userId }, status: { in: ["registered", "attended", "baptized"] } },
        limit: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: "event-registrations",
        where: { invitedBy: { equals: userId }, status: { in: ["attended", "baptized"] } },
        limit: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: "event-registrations",
        where: { invitedBy: { equals: userId }, status: { equals: "baptized" } },
        limit: 0,
        overrideAccess: true,
      }),
    ]);

    return {
      totalInvites: totalRes.totalDocs,
      registered: registeredRes.totalDocs,
      attended: attendedRes.totalDocs,
      baptized: baptizedRes.totalDocs,
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
    console.log(`[EVENT-INVITES] Fetching invites for user ${userId}`);
    const invites = await payload.find({
      collection: "event-invites",
      where: {
        and: [
          { invitedBy: { equals: userId } },
          { status: { equals: "active" } },
        ],
      },
      depth: 1,
      limit: 100,
      overrideAccess: true,
    });
    console.log(`[EVENT-INVITES] Got ${invites.docs.length} invites in ${Date.now() - t}ms`);

    // Filter to future registration-open events first
    const validInvites = invites.docs.filter((invite) => {
      const event = invite.event as unknown as { id: string; title: string; slug: string; startDate: string; status: string; location: string } | string;
      if (typeof event === "object" && event) {
        const startDate = new Date(event.startDate);
        return startDate > new Date() && event.status === "registration-open";
      }
      return false;
    });
    console.log(`[EVENT-INVITES] ${validInvites.length} valid invites after filtering`);

    if (validInvites.length === 0) return [];

    // Batch: get registration counts for all invites in parallel
    console.log(`[EVENT-INVITES] Fetching registration counts...`);
    const countResults = await Promise.all(
      validInvites.map((invite) =>
        payload.find({
          collection: "event-registrations",
          where: { eventInvite: { equals: invite.id } },
          limit: 0,
          overrideAccess: true,
        })
      )
    );
    console.log(`[EVENT-INVITES] Registration counts loaded in ${Date.now() - t}ms`);

    return validInvites.map((invite, i) => {
      const event = invite.event as unknown as { id: string; title: string; slug: string; startDate: string; status: string; location: string };
      return {
        eventId: event.id,
        eventTitle: event.title,
        eventSlug: event.slug,
        eventDate: event.startDate,
        eventLocation: event.location,
        inviteCode: invite.inviteCode,
        registrationCount: countResults[i].totalDocs,
      };
    });
  } catch (error) {
    console.error(`[EVENT-INVITES] Error after ${Date.now() - t}ms:`, error);
    return [];
  }
}
