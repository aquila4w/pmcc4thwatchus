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
      depth: 2,
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
    const {
      title,
      slug,
      description,
      location,
      address,
      startDate,
      endDate,
      timezone,
      status,
      maxAttendees,
      registrationEnabled,
      registrationDeadline,
      requireApproval,
      checkInEnabled,
      hasBaptism,
      heroImage,
      landingPageHeroImage,
      landingPageTitle,
      landingPageContent,
      landingPageShowQR,
      landingPageShowInviter,
      landingPageCTA,
      landingPageCTALink,
      thankYouTitle,
      thankYouMessage,
      showQRCode,
      sendConfirmationEmail,
      allowMultipleCheckIns,
      checkInStartTime,
      organizer,
      eventType,
      contactName,
      contactPhone,
      contactEmail,
      contactWebsite,
    } = body;

    const data: Record<string, unknown> = {
      title,
      slug,
      description,
      location,
      address,
      startDate,
      endDate,
      timezone,
      status,
      maxAttendees,
      registrationEnabled,
      registrationDeadline,
      requireApproval,
      checkInEnabled,
      hasBaptism,
      heroImage,
      landingPageHeroImage,
      landingPageTitle,
      landingPageContent,
      landingPageShowQR,
      landingPageShowInviter,
      landingPageCTA,
      landingPageCTALink,
      thankYouTitle,
      thankYouMessage,
      showQRCode,
      sendConfirmationEmail,
      allowMultipleCheckIns,
      checkInStartTime,
      organizer,
      eventType,
      contactName,
      contactPhone,
      contactEmail,
      contactWebsite,
    };

    // Auto-generate slug from title if provided
    if (title) {
      data.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const event = await payload.update({
      collection: "managed-events",
      id: eventId,
      data,
      depth: 2,
      overrideAccess: true,
    });

    return NextResponse.json(event);
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
