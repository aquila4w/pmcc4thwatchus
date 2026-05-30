import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * One-time migration: fix existing church QR registrations missing `invitedByChurch`.
 *
 * Finds registrations where:
 *   - sourceType === "church"
 *   - invitedByChurch is not set
 *
 * Then looks up the churchEventInvite → church, and patches the registration.
 *
 * Call once: POST /api/admin/fix-church-registrations
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });

    // Find all church-sourced registrations missing the church field
    const regs = await payload.find({
      collection: "event-registrations",
      where: {
        and: [
          { sourceType: { equals: "church" } },
          { invitedByChurch: { exists: false } },
        ],
      },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    });

    if (regs.totalDocs === 0) {
      return NextResponse.json({ message: "No registrations to fix", fixed: 0 });
    }

    let fixed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const reg of regs.docs) {
      try {
        const churchInviteId = reg.churchEventInvite as string | undefined;
        if (!churchInviteId) {
          skipped++;
          continue;
        }

        // Look up the church invite to get the church
        const churchInvite = await payload.findByID({
          collection: "church-event-invites",
          id: churchInviteId,
          depth: 0,
          overrideAccess: true,
        });

        const churchId = churchInvite?.church;
        if (!churchId) {
          skipped++;
          continue;
        }

        // Update the registration
        await payload.update({
          collection: "event-registrations",
          id: reg.id,
          data: {
            invitedByChurch: String(churchId),
          },
          depth: 0,
          overrideAccess: true,
        });

        fixed++;
      } catch (err) {
        errors.push(`Registration ${reg.id}: ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixed} registrations`,
      total: regs.totalDocs,
      fixed,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed", details: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}
