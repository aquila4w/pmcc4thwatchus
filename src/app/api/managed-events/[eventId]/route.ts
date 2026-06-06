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

// PATCH - Update event (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    console.log("[event-patch] 1. Starting update...");
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
    console.log("[event-patch] 2. Body keys:", Object.keys(body));

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

    console.log("[event-patch] 3. Update data keys:", Object.keys(data));
    console.log("[event-patch] 3b. Has landingPageContent?", "landingPageContent" in data);
    console.log("[event-patch] 3c. Has thankYouMessage?", "thankYouMessage" in data);

    console.log("[event-patch] 4. Calling payload.update()...");
    const event = await payload.update({
      collection: "managed-events",
      id: eventId,
      data,
      depth: 0,
      overrideAccess: true,
    });
    console.log("[event-patch] 5. payload.update() succeeded, typeof event:", typeof event);

    // Build a clean plain object from the result to avoid circular refs
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(event)) {
      if (key === "createdAt" || key === "updatedAt") {
        clean[key] = value;
      } else if (typeof value !== "object" || value === null) {
        clean[key] = value;
      } else if (Array.isArray(value)) {
        clean[key] = JSON.parse(JSON.stringify(value));
      } else {
        // For relationship/object fields, only keep id to avoid circular refs
        if (value && typeof value === "object" && "id" in value) {
          clean[key] = (value as { id: string }).id;
        } else {
          try {
            clean[key] = JSON.parse(JSON.stringify(value));
          } catch {
            clean[key] = String(value);
          }
        }
      }
    }

    console.log("[event-patch] 6. Clean response keys:", Object.keys(clean));
    return NextResponse.json(clean);
  } catch (error: unknown) {
    console.error("[event-patch] ERROR:", error);
    const message = error instanceof Error ? error.message : "Failed to update event";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[event-patch] ERROR STACK:", stack);
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
