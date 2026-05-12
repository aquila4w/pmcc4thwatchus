import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";

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
    const { registrations } = body;

    // Verify event exists
    const event = await payload.findByID({
      collection: "managed-events",
      id: eventId,
      depth: 0,
      overrideAccess: true,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!Array.isArray(registrations)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected an array of registrations." },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const reg of registrations) {
      try {
        // Check if registration already exists by code
        const existing = await payload.find({
          collection: "event-registrations",
          where: {
            and: [
              { event: { equals: eventId } },
              { registrationCode: { equals: reg.registrationCode } },
            ],
          },
          limit: 1,
        });

        const regData = {
          event: eventId,
          guestName: reg.guestName,
          guestEmail: reg.guestEmail || undefined,
          guestPhone: reg.guestPhone || undefined,
          status: reg.status || "registered",
          checkedInAt: reg.checkedInAt
            ? new Date(reg.checkedInAt)
            : undefined,
          baptizedAt: reg.baptizedAt
            ? new Date(reg.baptizedAt)
            : undefined,
        };

        if (existing.docs.length > 0) {
          // Update existing
          await payload.update({
            collection: "event-registrations",
            id: existing.docs[0].id,
            data: regData,
          });
          updated++;
        } else {
          // Create new
          await payload.create({
            collection: "event-registrations",
            data: {
              ...regData,
              registrationCode: reg.registrationCode,
            },
          });
          created++;
        }
      } catch (err) {
        errors.push(
          `Failed to import ${reg.guestName || reg.registrationCode}: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${created} created, ${updated} updated`,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Event import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
