import type { CollectionConfig, Where } from "payload";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateChurchInviteCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export const ChurchEventInvites: CollectionConfig = {
  slug: "church-event-invites",
  admin: {
    useAsTitle: "code",
    group: "Event Management",
    defaultColumns: ["code", "event", "church", "adPlacement", "status", "scanCount"],
    description: "Auto-generated QR codes for church-sponsored ad placements (billboards, buses, etc.)",
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (["superAdmin", "districtCoordinator", "eventAdmin"].includes(user.role)) return true;
      // Church leaders can see their own church's codes
      if (["headMinister", "secretary"].includes(user.role) && user.church) {
        return {
          church: { equals: typeof user.church === "string" ? user.church : user.church.id },
        } as Where;
      }
      if (user.role === "subDistrictCoordinator" && user.subDistrict) {
        return {
          church: {
            exists: true,
          },
        } as Where;
      }
      return false;
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
    // Unique code (8-char, non-guessable)
    {
      name: "code",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "Unique 8-character code for the QR URL",
        position: "sidebar",
      },
    },
    // Event
    {
      name: "event",
      type: "relationship",
      relationTo: "managed-events",
      required: true,
      index: true,
      admin: {
        description: "The event this QR code is for",
      },
    },
    // Church
    {
      name: "church",
      type: "relationship",
      relationTo: "churches",
      required: true,
      index: true,
      admin: {
        description: "The church sponsoring this ad",
      },
    },
    // Ad Placement (the "where")
    {
      name: "adPlacement",
      type: "relationship",
      relationTo: "ad-placements",
      required: true,
      index: true,
      admin: {
        description: "Where this ad is placed (billboard, bus, etc.)",
      },
    },
    // Contact details (can override church/placement defaults)
    {
      name: "contactName",
      type: "text",
      admin: {
        description: "Contact person name for this specific combo (overrides church/placement defaults)",
      },
    },
    {
      name: "contactEmail",
      type: "email",
      admin: {
        description: "Contact email for this specific combo",
      },
    },
    {
      name: "contactPhone",
      type: "text",
      admin: {
        description: "Contact phone for this specific combo",
      },
    },
    {
      name: "contactMember",
      type: "relationship",
      relationTo: "users",
      filterOptions: {
        role: { in: ["member", "headMinister", "secretary", "subDistrictCoordinator"] },
      },
      admin: {
        description: "Optional: link to an existing member as the contact person",
      },
    },
    // Status
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
        description: "Disabled codes won't resolve when scanned",
      },
    },
    // Scan count (updated via hooks/API)
    {
      name: "scanCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Number of times this QR code was scanned",
      },
    },
    // Registration count (virtual, computed via afterRead)
    {
      name: "registrationCount",
      type: "number",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Registrations from this QR code",
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.id) return 0;
            try {
              const registrations = await req.payload.find({
                collection: "event-registrations",
                where: {
                  churchEventInvite: { equals: data.id },
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
        // Auto-generate 8-char code on create
        if (operation === "create" && !data.code) {
          let code = generateChurchInviteCode();
          for (let attempt = 0; attempt < 10; attempt++) {
            const existing = await req.payload.find({
              collection: "church-event-invites",
              where: { code: { equals: code } },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            });
            if (existing.totalDocs === 0) break;
            code = generateChurchInviteCode();
          }
          data.code = code;
        }

        // Auto-populate contact from linked member
        if (data.contactMember && operation === "create") {
          try {
            const member = await req.payload.findByID({
              collection: "users",
              id: typeof data.contactMember === "string" ? data.contactMember : data.contactMember.id,
              depth: 0,
              overrideAccess: true,
            });
            if (member) {
              if (!data.contactName && member.name) data.contactName = member.name;
              if (!data.contactEmail && member.email) data.contactEmail = member.email;
              if (!data.contactPhone && member.phone) data.contactPhone = member.phone;
            }
          } catch {
            // Member lookup failed, keep manual contact fields
          }
        }

        return data;
      },
    ],
  },
  timestamps: true,
};
