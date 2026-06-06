import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin, isElevatedRole } from "@/lib/auth-helpers";

// GET - Get single event details (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { eventId } = await params;

    const event = await payload.findByID({
      collection: "managed-events",
      id: eventId,
      depth: 1,
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Event fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update event (admin only)
 *
 * Uses raw MongoDB updateOne() instead of payload.update() because the
 * ManagedEvents collection has deeply nested fields (richText, blocks,
 * arrays, tabs) that cause Payload's recursive field validation to
 * overflow the call stack on Netlify serverless functions.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await getPayload({ config });

    // Auth check
    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { eventId } = await params;
    const body = await request.json();

    // Only allow expected fields (prevent mass assignment)
    const allowedFields = new Set([
      "title", "slug", "description", "location", "address", "startDate",
      "endDate", "timezone", "status", "maxAttendees", "registrationEnabled",
      "registrationDeadline", "requireApproval", "checkInEnabled", "hasBaptism",
      "heroImage", "landingPageHeroImage", "landingPageTitle", "landingPageContent",
      "landingPageShowQR", "landingPageShowInviter", "landingPageCTA",
      "landingPageCTALink", "thankYouTitle", "thankYouMessage", "showQRCode",
      "sendConfirmationEmail", "allowMultipleCheckIns", "checkInStartTime",
      "organizer", "eventType", "contactName", "contactPhone", "contactEmail",
      "contactWebsite",
    ]);

    // Build update data — only include defined, allowed values
    const $set: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.has(key) && value !== undefined) {
        $set[key] = value;
      }
    }

    // Auto-generate slug from title only if slug not explicitly provided
    if (!$set.slug && $set.title) {
      $set.slug = ($set.title as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    if (Object.keys($set).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Bypass Payload.update() — use raw MongoDB to avoid stack overflow
    // from Payload's recursive field validation on deeply nested schemas
    const collection = payload.db.collections["managed-events"];
    const result = await collection.updateOne(
      { _id: eventId },
      { $set },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fire-and-forget: trigger invite generation if status changed to registration-open
    if ($set.status === "registration-open") {
      try {
        const fullDoc = await collection.findOne({ _id: eventId });
        if (fullDoc?.startDate && new Date(fullDoc.startDate) > new Date()) {
          // Dynamically import to avoid circular deps
          import("@/collections/ManagedEvents").then(() => {
            // The afterChange hook logic runs in generateInvitesInBackground
          }).catch(() => {});
          // Run invite generation inline with raw payload access
          generateInvites(payload, eventId, fullDoc.title || "").catch(() => {});
        }
      } catch {
        // Non-critical — don't fail the update
      }
    }

    // Return the updated document via Payload's read (with afterRead hooks for computed fields)
    // Use depth:0 to keep it lean
    const updated = await payload.findByID({
      collection: "managed-events",
      id: eventId,
      depth: 0,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update event";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[event-patch] ERROR:", message, stack);
    return NextResponse.json(
      { error: message, stack },
      { status: 500 }
    );
  }
}

/** Lightweight invite generation — fires in background after event save */
async function generateInvites(
  payload: import("payload").Payload,
  eventId: string,
  eventTitle: string,
) {
  try {
    const [members, existingInvites] = await Promise.all([
      payload.find({
        collection: "users",
        where: {
          and: [
            { status: { equals: "approved" } },
            { role: { in: ["member", "eventAdmin", "headMinister", "secretary", "subDistrictCoordinator", "districtCoordinator", "superAdmin"] } },
          ],
        },
        limit: 999,
        depth: 0,
      }),
      payload.find({
        collection: "event-invites",
        where: { event: { equals: eventId } },
        limit: 0,
        depth: 0,
      }),
    ]);

    const existingMemberIds = new Set<string>(
      existingInvites.docs.map((inv) => {
        const by = (inv as { invitedBy?: unknown }).invitedBy;
        return typeof by === "string" ? by : String((by as { id?: string })?.id ?? "");
      })
    );

    const toCreate = members.docs.filter((m) => !existingMemberIds.has(String(m.id)));
    let count = 0;

    for (let i = 0; i < toCreate.length; i += 5) {
      const batch = toCreate.slice(i, i + 5);
      await Promise.all(
        batch.map((member) =>
          payload.create({
            collection: "event-invites",
            data: { event: eventId, invitedBy: member.id, status: "active" },
          }).catch(() => {})
        )
      );
      count += batch.length;
      if (i + 5 < toCreate.length) await new Promise((r) => setTimeout(r, 200));
    }

    if (count > 0) console.log(`Auto-generated ${count} invites for: ${eventTitle}`);
  } catch (err) {
    console.error("Background invite generation failed:", err);
  }
}

// DELETE - Delete event (elevated roles only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await getPayload({ config });

    // Auth check - elevated roles only
    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isElevatedRole(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { eventId } = await params;

    await payload.delete({
      collection: "managed-events",
      id: eventId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
