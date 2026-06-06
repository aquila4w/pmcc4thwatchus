import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Where } from "payload";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";

// GET - List registrations for an event with filters
export async function GET(
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
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const statusParam = searchParams.get("status"); // comma-separated: "registered,attended"
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const sort = searchParams.get("sort") || "-registeredAt";

    // Build where clause
    const where: Where = {
      and: [
        { event: { equals: eventId } },
      ],
    };

    // Support comma-separated statuses for multi-select filter
    if (statusParam) {
      const statuses = statusParam.split(",").map(s => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        where.and?.push({ status: { equals: statuses[0] } });
      } else if (statuses.length > 1) {
        where.and?.push({ status: { in: statuses } });
      }
    }

    if (search) {
      where.and?.push({
        or: [
          { "guestInfo.name": { like: search } },
          { "guestInfo.email": { like: search } },
          { "guestInfo.phone": { like: search } },
          { inviteCode: { like: search } },
        ],
      });
    }

    const result = await payload.find({
      collection: "event-registrations",
      where,
      sort,
      limit,
      page,
      depth: 1,
    });

    // Get status counts for filter pills (lightweight indexed lookups)
    const allStatuses = ["invited", "registered", "confirmed", "attended", "baptized", "waitlisted", "cancelled"] as const;
    const statusCounts: Record<string, number> = {};
    const countBase: Where = {
      and: [
        { event: { equals: eventId } },
        ...(search ? [{
          or: [
            { "guestInfo.name": { like: search } },
            { "guestInfo.email": { like: search } },
            { "guestInfo.phone": { like: search } },
            { inviteCode: { like: search } },
          ],
        }] : []),
      ],
    };

    const countPromises = allStatuses.map(async (s) => {
      const countWhere: Where = {
        and: [
          ...((countBase.and as Where[]) || []),
          { status: { equals: s } },
        ],
      };
      const countResult = await payload.count({
        collection: "event-registrations",
        where: countWhere,
      });
      statusCounts[s] = countResult.totalDocs;
    });

    await Promise.all(countPromises);

    // Resolve source labels: ad placement names, platform names, and church names.
    // With depth:1, churchEventInvite and platformEventLink are populated objects,
    // but their nested relationships (adPlacement, platform, church) are just IDs.
    // Batch-resolve the names to avoid N+1 queries.
    const adPlacementIds = new Set<string>();
    const platformIds = new Set<string>();
    const churchIds = new Set<string>();

    for (const doc of result.docs) {
      const cei = doc.churchEventInvite as { adPlacement?: string; church?: string } | null;
      if (cei?.adPlacement && typeof cei.adPlacement === "string") {
        adPlacementIds.add(cei.adPlacement);
      }
      if (cei?.church && typeof cei.church === "string") {
        churchIds.add(cei.church);
      }
      const pel = doc.platformEventLink as { platform?: string } | null;
      if (pel?.platform && typeof pel.platform === "string") {
        platformIds.add(pel.platform);
      }
    }

    const [adPlacements, platforms, churches] = await Promise.all([
      adPlacementIds.size > 0
        ? payload.find({
            collection: "ad-placements",
            where: { id: { in: [...adPlacementIds] } },
            limit: adPlacementIds.size,
            depth: 0,
            overrideAccess: true,
          })
        : { docs: [] },
      platformIds.size > 0
        ? payload.find({
            collection: "online-platforms",
            where: { id: { in: [...platformIds] } },
            limit: platformIds.size,
            depth: 0,
            overrideAccess: true,
          })
        : { docs: [] },
      churchIds.size > 0
        ? payload.find({
            collection: "churches",
            where: { id: { in: [...churchIds] } },
            limit: churchIds.size,
            depth: 0,
            overrideAccess: true,
          })
        : { docs: [] },
    ]);

    const adPlacementNames = new Map(
      adPlacements.docs.map((ap) => [String(ap.id), String((ap as Record<string, unknown>).name)])
    );
    const platformNames = new Map(
      platforms.docs.map((p) => [String(p.id), String((p as Record<string, unknown>).name)])
    );
    const churchNames = new Map(
      churches.docs.map((c) => [String(c.id), String((c as Record<string, unknown>).name)])
    );

    const referralLabels: Record<string, string> = {
      friend: "Friend",
      family: "Family",
      "social-media": "Social Media",
      "church-member": "Church Member",
      flyer: "Flyer",
      other: "Other",
    };

    // Enrich each doc with a human-readable sourceLabel + inviterName
    const docs = result.docs.map((doc: Record<string, unknown>) => {
      const sourceType = doc.sourceType as string;
      const church = doc.invitedByChurch as { name?: string } | null;

      // Resolve inviter name (available at depth:1)
      const inviter = doc.invitedBy as { name?: string } | null;
      const inviterName = inviter?.name || null;

      let sourceLabel = "";
      if (sourceType === "walk-in") {
        const referral = doc.referralSource as string | undefined;
        const referralOther = doc.referralSourceOther as string | undefined;
        if (referral) {
          const label = referral === "other" && referralOther
            ? `Other: ${referralOther}`
            : (referralLabels[referral] || referral);
          sourceLabel = `Walk-in · ${label}`;
        } else {
          sourceLabel = "Walk-in";
        }
      } else if (church?.name) {
        sourceLabel = church.name;
      } else if (sourceType === "church") {
        const cei = doc.churchEventInvite as { adPlacement?: string; church?: string } | null;
        const ceiChurchName = cei?.church ? churchNames.get(cei.church) : undefined;
        const placementName = cei?.adPlacement ? adPlacementNames.get(cei.adPlacement) : undefined;
        if (ceiChurchName && placementName) {
          sourceLabel = `${ceiChurchName} · ${placementName}`;
        } else if (ceiChurchName) {
          sourceLabel = ceiChurchName;
        } else if (placementName) {
          sourceLabel = placementName;
        } else {
          sourceLabel = "Church Ad";
        }
      } else if (sourceType === "platform") {
        const pel = doc.platformEventLink as { platform?: string } | null;
        if (pel?.platform) {
          sourceLabel = platformNames.get(pel.platform) || "Online Platform";
        } else {
          sourceLabel = "Online Platform";
        }
      } else {
        // Member invite — show inviter name if available
        if (inviterName) {
          sourceLabel = `Invite by ${inviterName}`;
        } else {
          sourceLabel = "Member Invite";
        }
      }

      // Resolve guest user ID (depth:1 populates as object)
      const guestUserId = typeof doc.guest === "string"
        ? doc.guest
        : (doc.guest as { id?: string })?.id || null;

      return { ...doc, sourceLabel, inviterName, guestUserId };
    });

    return NextResponse.json({
      docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
      statusCounts,
    });
  } catch (error) {
    console.error("Registrations list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}

// PATCH - Bulk update registration status
export async function PATCH(
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

    const { registrationIds, status, notes } = body;

    if (!registrationIds || !Array.isArray(registrationIds)) {
      return NextResponse.json(
        { error: "registrationIds array is required" },
        { status: 400 }
      );
    }

    // Validate that all registration IDs belong to the specified event
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        and: [
          { id: { in: registrationIds } },
          { event: { equals: eventId } },
        ],
      },
      limit: registrationIds.length,
      depth: 0,
    });

    if (registrations.docs.length !== registrationIds.length) {
      return NextResponse.json(
        { error: "Some registration IDs do not belong to this event" },
        { status: 400 }
      );
    }

    // Update each registration
    const updatePromises = registrationIds.map((id: string) =>
      payload.update({
        collection: "event-registrations",
        id,
        data: {
          ...(status && { status }),
          ...(notes && { notes }),
        },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, updated: registrationIds.length });
  } catch (error) {
    console.error("Registrations update error:", error);
    return NextResponse.json(
      { error: "Failed to update registrations" },
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete registrations
export async function DELETE(
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
    const { searchParams } = new URL(request.url);

    const registrationIds = searchParams.get("ids")?.split(",");

    if (!registrationIds || registrationIds.length === 0) {
      return NextResponse.json(
        { error: "ids parameter is required" },
        { status: 400 }
      );
    }

    // Delete each registration
    const deletePromises = registrationIds.map((id) =>
      payload.delete({
        collection: "event-registrations",
        id,
      })
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ success: true, deleted: registrationIds.length });
  } catch (error) {
    console.error("Registrations delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete registrations" },
      { status: 500 }
    );
  }
}
