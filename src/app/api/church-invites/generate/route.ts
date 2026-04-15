import { NextRequest, NextResponse } from "next/server";
import { getPayload, type Where } from "payload";
import config from "@payload-config";

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const body = await request.json();
    const { eventId, churchId, adPlacementId, regenerate } = body;

    // Build where clauses
    const eventWhere: Where = eventId
      ? { id: { equals: eventId } }
      : { status: { equals: "registration-open" } };

    const churchWhere: Where = churchId
      ? { id: { equals: churchId } }
      : {};

    const placementWhere: Where = adPlacementId
      ? { id: { equals: adPlacementId } }
      : { status: { equals: "active" } };

    // Fetch all three dimensions
    const [events, churches, placements] = await Promise.all([
      payload.find({
        collection: "managed-events",
        where: eventWhere,
        limit: 100,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: "churches",
        where: churchWhere,
        limit: 200,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: "ad-placements",
        where: placementWhere,
        limit: 100,
        depth: 0,
        overrideAccess: true,
      }),
    ]);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    // Generate codes for each combination
    for (const event of events.docs) {
      for (const church of churches.docs) {
        for (const placement of placements.docs) {
          try {
            // Check if code already exists for this combo
            const existing = await payload.find({
              collection: "church-event-invites",
              where: {
                and: [
                  { event: { equals: event.id } },
                  { church: { equals: church.id } },
                  { adPlacement: { equals: placement.id } },
                ],
              },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            });

            if (existing.totalDocs > 0) {
              if (regenerate) {
                // Delete existing and recreate
                await payload.delete({
                  collection: "church-event-invites",
                  id: existing.docs[0].id,
                  depth: 0,
                  overrideAccess: true,
                });
              } else {
                skipped++;
                continue;
              }
            }

            await payload.create({
              collection: "church-event-invites",
              data: {
                event: event.id,
                church: church.id,
                adPlacement: placement.id,
                status: "active",
              },
              depth: 0,
              overrideAccess: true,
            });
            created++;
          } catch (err) {
            console.error(`Failed to generate code for ${church.name} x ${placement.name}:`, err);
            errors++;
          }
        }
      }
    }

    return NextResponse.json({
      created,
      skipped,
      errors,
      total: events.totalDocs * churches.totalDocs * placements.totalDocs,
    });
  } catch (error) {
    console.error("Church invite generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
