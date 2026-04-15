import type { CollectionConfig } from "payload";

export const AdPlacements: CollectionConfig = {
  slug: "ad-placements",
  admin: {
    useAsTitle: "name",
    group: "Event Management",
    defaultColumns: ["name", "slug", "status"],
    description: "Ad placement categories for church QR code campaigns (billboard, bus, flyer, etc.)",
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "eventAdmin"].includes(user.role);
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "eventAdmin"].includes(user.role);
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description: "Placement category name (e.g., Billboard, Bus Ad, Flyer)",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "URL-friendly identifier",
      },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Optional description of this ad placement type",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "Disabled", value: "disabled" },
      ],
      admin: {
        position: "sidebar",
        description: "Active placements will auto-generate church invite codes",
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.name && !data.slug) {
          data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Auto-generate church event invites when a new ad placement is created
        if (operation === "create") {
          try {
            const [events, churches] = await Promise.all([
              req.payload.find({
                collection: "managed-events",
                where: { status: { equals: "registration-open" } },
                limit: 100,
                depth: 0,
                overrideAccess: true,
              }),
              req.payload.find({
                collection: "churches",
                limit: 200,
                depth: 0,
                overrideAccess: true,
              }),
            ]);

            let created = 0;
            for (const event of events.docs) {
              for (const church of churches.docs) {
                const existing = await req.payload.find({
                  collection: "church-event-invites",
                  where: {
                    and: [
                      { event: { equals: event.id } },
                      { church: { equals: church.id } },
                      { adPlacement: { equals: doc.id } },
                    ],
                  },
                  limit: 1,
                  depth: 0,
                  overrideAccess: true,
                });

                if (existing.totalDocs === 0) {
                  await req.payload.create({
                    collection: "church-event-invites",
                    data: {
                      event: event.id,
                      church: church.id,
                      adPlacement: doc.id,
                      status: "active",
                    },
                    depth: 0,
                    overrideAccess: true,
                  });
                  created++;
                }
              }
            }

            if (created > 0) {
              console.log(`Auto-generated ${created} church event invites for new placement: ${doc.name}`);
            }
          } catch (error) {
            console.error("Failed to auto-generate church event invites for new placement:", error);
          }
        }
      },
    ],
  },
  timestamps: true,
};
