import type { CollectionConfig } from "payload";

export const OnlinePlatforms: CollectionConfig = {
  slug: "online-platforms",
  admin: {
    useAsTitle: "name",
    group: "Event Management",
    defaultColumns: ["name", "slug", "iconIdentifier", "status"],
    description: "Online platforms for event QR codes and link sharing (social media, search, event sites)",
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
        description: "Platform name (e.g., Meta, TikTok, YouTube)",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "URL-friendly identifier (e.g., meta, tiktok, youtube)",
      },
    },
    {
      name: "iconIdentifier",
      type: "text",
      required: true,
      admin: {
        description: "Icon key for UI display (e.g., 'meta', 'tiktok', 'youtube', 'google', 'eventbrite')",
      },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Optional description of this platform",
      },
    },
    {
      name: "urlTemplate",
      type: "text",
      admin: {
        description: "Optional URL template for deep-linking (e.g., 'https://facebook.com/{handle}')",
      },
    },
    {
      name: "color",
      type: "text",
      admin: {
        description: "Brand color hex for UI (e.g., '#1877F2' for Meta)",
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
        description: "Active platforms will auto-generate event links",
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
        if (data.name && !data.iconIdentifier) {
          data.iconIdentifier = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        }
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === "create") {
          try {
            const events = await req.payload.find({
              collection: "managed-events",
              where: { status: { equals: "registration-open" } },
              limit: 100,
              depth: 0,
              overrideAccess: true,
            });

            let created = 0;
            for (const event of events.docs) {
              const existing = await req.payload.find({
                collection: "platform-event-links",
                where: {
                  and: [
                    { event: { equals: event.id } },
                    { platform: { equals: doc.id } },
                  ],
                },
                limit: 1,
                depth: 0,
                overrideAccess: true,
              });

              if (existing.totalDocs === 0) {
                await req.payload.create({
                  collection: "platform-event-links",
                  data: {
                    event: event.id,
                    platform: doc.id,
                    status: "active",
                  },
                  depth: 0,
                  overrideAccess: true,
                });
                created++;
              }
            }

            if (created > 0) {
              console.log(`Auto-generated ${created} platform event links for new platform: ${doc.name}`);
            }
          } catch (error) {
            console.error("Failed to auto-generate platform event links:", error);
          }
        }
      },
    ],
  },
  timestamps: true,
};
