import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";

// GET - Get single registration details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; registrationId: string }> }
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

    const { registrationId } = await params;

    const registration = await payload.findByID({
      collection: "event-registrations",
      id: registrationId,
      depth: 2,
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(registration);
  } catch (error) {
    console.error("Registration fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration" },
      { status: 500 }
    );
  }
}

// PATCH - Update single registration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; registrationId: string }> }
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

    const { registrationId } = await params;
    const body = await request.json();

    // Only allow updating specific fields (prevent mass assignment)
    const allowedFields = ["status", "attendedAt", "baptizedAt", "notes", "guestInfo", "checkedInBy", "waitlistPosition", "promotedFromWaitlistAt", "reminderDayBeforeSent", "reminderHourBeforeSent"] as const;
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    // Handle special status changes that need timestamps
    if (updateData.status === "attended" && !updateData.attendedAt) {
      updateData.attendedAt = new Date().toISOString();
    }

    if (updateData.status === "baptized" && !updateData.baptizedAt) {
      updateData.baptizedAt = new Date().toISOString();
    }

    const registration = await payload.update({
      collection: "event-registrations",
      id: registrationId,
      data: updateData,
      depth: 2,
    });

    return NextResponse.json(registration);
  } catch (error: unknown) {
    console.error("Registration update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update registration";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// DELETE - Delete single registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; registrationId: string }> }
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

    const { registrationId } = await params;

    await payload.delete({
      collection: "event-registrations",
      id: registrationId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete registration" },
      { status: 500 }
    );
  }
}
