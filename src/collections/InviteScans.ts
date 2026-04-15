import type { CollectionConfig } from "payload";

export const InviteScans: CollectionConfig = {
  slug: "invite-scans",
  admin: {
    useAsTitle: "inviteCode",
    group: "Event Management",
    defaultColumns: ["inviteCode", "inviteType", "event", "device", "scannedAt"],
    description: "Visit/scan tracking for both member and church invite QR codes",
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "eventAdmin"].includes(user.role);
    },
    create: () => true, // Public — registration page records scans
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "eventAdmin"].includes(user.role);
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return user.role === "superAdmin";
    },
  },
  fields: [
    {
      name: "inviteType",
      type: "select",
      required: true,
      options: [
        { label: "Member Invite", value: "member" },
        { label: "Church Ad", value: "church" },
      ],
      admin: {
        description: "Whether the scan came from a member invite or church ad QR",
      },
    },
    {
      name: "inviteCode",
      type: "text",
      required: true,
      index: true,
      admin: {
        description: "The code from the scanned QR URL",
      },
    },
    // Relationships (one will be populated depending on inviteType)
    {
      name: "eventInvite",
      type: "relationship",
      relationTo: "event-invites",
      admin: {
        description: "Linked event invite (for member scans)",
      },
    },
    {
      name: "churchEventInvite",
      type: "relationship",
      relationTo: "church-event-invites",
      admin: {
        description: "Linked church event invite (for church ad scans)",
      },
    },
    {
      name: "event",
      type: "relationship",
      relationTo: "managed-events",
      required: true,
      index: true,
      admin: {
        description: "The event this scan relates to",
      },
    },
    // Denormalized for fast analytics queries
    {
      name: "church",
      type: "relationship",
      relationTo: "churches",
      admin: {
        description: "Church (denormalized for analytics)",
      },
    },
    {
      name: "adPlacement",
      type: "relationship",
      relationTo: "ad-placements",
      admin: {
        description: "Ad placement (for church scans)",
      },
    },
    // Device tracking
    {
      name: "ipAddress",
      type: "text",
      admin: {
        description: "Client IP address",
      },
    },
    {
      name: "userAgent",
      type: "text",
      admin: {
        description: "Raw User-Agent header",
      },
    },
    {
      name: "device",
      type: "text",
      admin: {
        description: "Parsed device type (mobile/tablet/desktop)",
      },
    },
    {
      name: "os",
      type: "text",
      admin: {
        description: "Parsed operating system",
      },
    },
    {
      name: "browser",
      type: "text",
      admin: {
        description: "Parsed browser name",
      },
    },
    // Timing
    {
      name: "scannedAt",
      type: "date",
      required: true,
      defaultValue: new Date().toISOString(),
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        description: "When the QR was scanned / page loaded",
      },
    },
    // Conversion tracking
    {
      name: "registered",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Whether this scan resulted in a registration",
        position: "sidebar",
      },
    },
    {
      name: "registration",
      type: "relationship",
      relationTo: "event-registrations",
      admin: {
        description: "Linked registration (if converted)",
        position: "sidebar",
      },
    },
  ],
  timestamps: true,
};
