import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

// GET - Get single registration details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; registrationId: string }> }
) {
  try {
    const payload = await getPayload({ config });
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
    const { registrationId } = await params;
    const body = await request.json();

    // Handle special status changes that need timestamps
    const updateData: Record<string, unknown> = { ...body };

    if (body.status === "attended" && !body.attendedAt) {
      updateData.attendedAt = new Date().toISOString();
    }

    if (body.status === "baptized" && !body.baptizedAt) {
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
