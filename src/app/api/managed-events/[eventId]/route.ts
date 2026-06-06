import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin, isElevatedRole } from "@/lib/auth-helpers";

/** Safely serialize a Payload response, replacing circular references. */
function safeJson(obj: unknown): unknown {
  const seen = new WeakSet();
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return undefined;
        seen.add(value);
      }
      return value;
    })
  );
}

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

    return NextResponse.json(safeJson(event));
  } catch (error) {
    console.error("Event fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PATCH - Update event (admin only)
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
    const allowedFields = [
      "title", "slug", "description", "location", "address", "startDate",
      "endDate", "timezone", "status", "maxAttendees", "registrationEnabled",
      "registrationDeadline", "requireApproval", "checkInEnabled", "hasBaptism",
      "heroImage", "landingPageHeroImage", "landingPageTitle", "landingPageContent",
      "landingPageShowQR", "landingPageShowInviter", "landingPageCTA",
      "landingPageCTALink", "thankYouTitle", "thankYouMessage", "showQRCode",
      "sendConfirmationEmail", "allowMultipleCheckIns", "checkInStartTime",
      "organizer", "eventType", "contactName", "contactPhone", "contactEmail",
      "contactWebsite",
    ];

    // Build update data — only include defined values to avoid corrupting
    // richText fields (landingPageContent, thankYouMessage) or triggering
    // Payload validation on fields the edit form doesn't manage
    const data: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        data[key] = body[key];
      }
    }

    // Auto-generate slug from title only if slug not explicitly provided
    if (!data.slug && data.title) {
      data.slug = (data.title as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Perform the update — use depth:0 to prevent circular reference
    // issues during JSON serialization of populated relationships
    const event = await payload.update({
      collection: "managed-events",
      id: eventId,
      data,
      depth: 0,
      overrideAccess: true,
    });

    // Use safeJson to strip any circular references Payload may have added
    return NextResponse.json(safeJson(event));
  } catch (error: unknown) {
    console.error("Event update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update event";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
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
