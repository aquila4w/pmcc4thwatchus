import { NextResponse } from "next/server";
import { getPayload } from "payload";
import { headers } from "next/headers";
import config from "@payload-config";

export async function POST() {
  try {
    const payload = await getPayload({ config });
    const headersList = await headers();
    const { user } = await payload.auth({ headers: headersList });

    if (!user || !["superAdmin", "districtCoordinator"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const eligibleRoles = ["member", "eventAdmin", "headMinister", "secretary", "subDistrictCoordinator", "districtCoordinator", "superAdmin"];

    // Get all future registration-open events
    const events = await payload.find({
      collection: "managed-events",
      where: {
        and: [
          { status: { equals: "registration-open" } },
          { startDate: { greater_than: new Date().toISOString() } },
        ],
      },
      limit: 100,
      depth: 0,
    });

    // Get all approved members with eligible roles
    const members = await payload.find({
      collection: "users",
      where: {
        and: [
          { status: { equals: "approved" } },
          { role: { in: eligibleRoles } },
        ],
      },
      limit: 999,
      depth: 0,
    });

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const member of members.docs) {
      for (const event of events.docs) {
        try {
          // Check if invite already exists
          const existing = await payload.find({
            collection: "event-invites",
            where: {
              and: [
                { event: { equals: event.id } },
                { invitedBy: { equals: member.id } },
              ],
            },
            limit: 1,
          });

          if (existing.totalDocs > 0) {
            skipped++;
            continue;
          }

          await payload.create({
            collection: "event-invites",
            data: {
              event: event.id,
              invitedBy: member.id,
              status: "active",
            },
          });
          created++;
        } catch (error) {
          console.error(`Failed to create invite for member ${member.id}, event ${event.id}:`, error);
          errors++;
        }
      }
    }

    return NextResponse.json({
      message: `Invite generation complete`,
      events: events.totalDocs,
      members: members.totalDocs,
      created,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("Seed invites error:", error);
    return NextResponse.json(
      { error: "Failed to generate invites" },
      { status: 500 }
    );
  }
}
