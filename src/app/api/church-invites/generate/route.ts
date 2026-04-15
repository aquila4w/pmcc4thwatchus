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

    // Fetch all three dimensions in parallel
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

    // Fetch ALL existing invites for these events in ONE query per event
    // to avoid N×M individual lookups that cause 504 timeouts
    const existingKeys = new Set<string>();
    const idsToDelete: string[] = [];

    for (const event of events.docs) {
      const existing = await payload.find({
        collection: "church-event-invites",
        where: { event: { equals: event.id } },
        limit: 0, // all docs
        depth: 0,
        overrideAccess: true,
      });

      for (const inv of existing.docs) {
        const key = `${event.id}|${inv.church as string}|${inv.adPlacement as string}`;
        existingKeys.add(key);
        if (regenerate) {
          idsToDelete.push(String(inv.id));
        }
      }
    }

    // Bulk delete if regenerating
    if (regenerate && idsToDelete.length > 0) {
      await Promise.all(
        idsToDelete.map((id) =>
          payload.delete({
            collection: "church-event-invites",
            id,
            depth: 0,
            overrideAccess: true,
          })
        )
      );
      existingKeys.clear();
    }

    // Collect combos that need creation
    const toCreate: { eventId: string; churchId: string; placementId: string }[] = [];

    for (const event of events.docs) {
      for (const church of churches.docs) {
        for (const placement of placements.docs) {
          const key = `${String(event.id)}|${String(church.id)}|${String(placement.id)}`;
          if (!existingKeys.has(key)) {
            toCreate.push({
              eventId: String(event.id),
              churchId: String(church.id),
              placementId: String(placement.id),
            });
          }
        }
      }
    }

    // Create in parallel batches of 10 to avoid overwhelming MongoDB
    let created = 0;
    let errors = 0;
    const batchSize = 10;
    for (let i = 0; i < toCreate.length; i += batchSize) {
      const batch = toCreate.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(({ eventId: eid, churchId: cid, placementId: pid }) =>
          payload.create({
            collection: "church-event-invites",
            data: {
              event: eid,
              church: cid,
              adPlacement: pid,
              status: "active",
            },
            depth: 0,
            overrideAccess: true,
          })
        )
      );
      for (const r of results) {
        if (r.status === "fulfilled") created++;
        else errors++;
      }
    }

    const skipped = events.totalDocs * churches.totalDocs * placements.totalDocs - toCreate.length - (regenerate ? 0 : 0);

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
