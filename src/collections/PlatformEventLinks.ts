import type { CollectionConfig } from "payload";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePlatformCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export const PlatformEventLinks: CollectionConfig = {
  slug: "platform-event-links",
  admin: {
    useAsTitle: "code",
    group: "Event Management",
    defaultColumns: ["code", "event", "platform", "status", "scanCount"],
    description: "Short URLs and QR codes for online platform sharing (social media, search, event sites)",
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "eventAdmin"].includes(user.role);
    },
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
      name: "code",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "Unique 8-character code for the short URL / QR code",
        position: "sidebar",
      },
    },
    {
      name: "event",
      type: "relationship",
      relationTo: "managed-events",
      required: true,
      index: true,
      admin: {
        description: "The event this link is for",
      },
    },
    {
      name: "platform",
      type: "relationship",
      relationTo: "online-platforms",
      required: true,
      index: true,
      admin: {
        description: "The online platform (Meta, TikTok, YouTube, etc.)",
      },
    },
    {
      name: "customUrl",
      type: "text",
      admin: {
        description: "Optional override URL (if blank, auto-generates from event slug + UTM params)",
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
        description: "Disabled links won't redirect when scanned",
      },
    },
    {
      name: "scanCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Number of times this QR/URL was visited",
      },
    },
    {
      name: "registrationCount",
      type: "number",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Registrations from this platform link",
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.id) return 0;
            try {
              const registrations = await req.payload.find({
                collection: "event-registrations",
                where: {
                  and: [
                    { platformEventLink: { equals: data.id } },
                  ],
                },
                limit: 0,
                depth: 0,
                overrideAccess: true,
              });
              return registrations.totalDocs;
            } catch {
              return 0;
            }
          },
        ],
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === "create" && !data.code) {
          let code = generatePlatformCode();
          for (let attempt = 0; attempt < 10; attempt++) {
            const existing = await req.payload.find({
              collection: "platform-event-links",
              where: { code: { equals: code } },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            });
            if (existing.totalDocs === 0) break;
            code = generatePlatformCode();
          }
          data.code = code;
        }
        return data;
      },
    ],
  },
  timestamps: true,
};
