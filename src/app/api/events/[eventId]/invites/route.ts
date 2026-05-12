import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import type { Where } from "payload";
import { randomInt } from "crypto";

// GET - List all invites for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const church = searchParams.get("church");

    // Build where clause
    const where: Where = {
      and: [
        { event: { equals: eventId } },
      ],
    };

    // Filter by church if provided
    if (church) {
      where.and?.push({ church: { equals: church } });
    }

    const invites = await payload.find({
      collection: "event-invites",
      where: where,
      sort: "memberContactName",
      limit: 999,
      depth: 1,
    });

    return NextResponse.json({
      invites: invites.docs.map((invite) => ({
        id: invite.id,
        inviteCode: invite.inviteCode,
        invitedBy: typeof invite.invitedBy === "string" ? invite.invitedBy : (invite.invitedBy as { id?: string })?.id,
        memberName: invite.memberContactName,
        memberPhone: invite.memberContactPhone,
        memberEmail: invite.memberContactEmail,
        church: invite.church,
        registrationCount: invite.registrationCount || 0,
        status: invite.status,
      })),
      total: invites.totalDocs,
    });
  } catch (error) {
    console.error("Event invites list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Generate or regenerate invites for an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await getPayload({ config });

    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { eventId } = await params;
    const body = await request.json();
    const { regenerate = false, churchId = null } = body;

    // Verify event exists
    const event = await payload.findByID({
      collection: "managed-events",
      id: eventId,
      depth: 0,
      overrideAccess: true,
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Find all approved members who can invite guests
    const memberWhere: Where = {
      and: [
        { status: { equals: "approved" } },
        {
          role: {
            in: ["member", "headMinister", "secretary", "subDistrictCoordinator", "districtCoordinator", "superAdmin"],
          },
        },
      ],
    };

    // Filter by church if provided
    if (churchId) {
      memberWhere.and?.push({
        church: { equals: churchId },
      });
    }

    const members = await payload.find({
      collection: "users",
      where: memberWhere,
      limit: 999,
      depth: 1,
    });

    // Get existing invites for this event
    const existingInvitesWhere: Where = {
      event: { equals: eventId },
    };

    // Filter by church if provided
    if (churchId) {
      existingInvitesWhere.church = { equals: churchId };
    }

    const existingInvites = await payload.find({
      collection: "event-invites",
      where: existingInvitesWhere,
      limit: 999,
    });

    const existingInviteMap = new Map<string, string>();
    existingInvites.docs.forEach((invite: unknown) => {
      const invitedBy = (invite as { invitedBy?: unknown }).invitedBy;
      const id = (invite as { id?: string }).id;
      const memberId = typeof invitedBy === "string" ? invitedBy : (invitedBy as { id?: string })?.id;
      if (memberId && id) {
        existingInviteMap.set(memberId, id);
      }
    });

    let createdCount = 0;
    const results = [];

    // Create invites for members who don't have one yet
    for (const member of members.docs) {
      const memberId = typeof member.id === "string" ? member.id : String(member.id);
      const existingInviteId = existingInviteMap.get(memberId);

      if (!existingInviteId) {
        // Create new invite
        const newInvite = await payload.create({
          collection: "event-invites",
          data: {
            event: eventId,
            invitedBy: memberId,
            status: "active",
          },
        });
        createdCount++;
        results.push({
          action: "created",
          memberName: member.name,
          inviteCode: newInvite.inviteCode,
        });
      } else if (regenerate) {
        // Regenerate invite code (short 8-char code)
        const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let newCode = "";
        for (let i = 0; i < 8; i++) {
          newCode += CHARS[randomInt(CHARS.length)];
        }
        const regeneratedInvite = await payload.update({
          collection: "event-invites",
          id: existingInviteId,
          data: {
            inviteCode: newCode,
            status: "active",
          },
        });
        results.push({
          action: "regenerated",
          memberName: member.name,
          inviteCode: regeneratedInvite.inviteCode,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} invites (${createdCount} new)`,
      created: createdCount,
      regenerated: regenerate ? results.filter(r => r.action === "regenerated").length : 0,
      totalMembers: members.totalDocs,
      results: results.slice(0, 50), // Return first 50 results
    });
  } catch (error) {
    console.error("Event invites generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
