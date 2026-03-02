import type { CollectionConfig } from "payload";

export const EventRegistrations: CollectionConfig = {
  slug: "event-registrations",
  admin: {
    useAsTitle: "inviteCode",
    group: "Event Management",
    defaultColumns: ["guest", "event", "status", "registeredAt", "attendedAt"],
    description: "Registration records for managed events",
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (["superAdmin", "districtCoordinator"].includes(user.role)) return true;
      if (user.role === "guest") {
        return {
          guest: { equals: user.id },
        };
      }
      return true;
    },
    create: () => true, // Public registration
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"].includes(user.role);
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
    },
  },
  fields: [
    {
      name: "inviteCode",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "Unique invite code (UUID) - not guessable",
        readOnly: true,
      },
    },
    {
      name: "event",
      type: "relationship",
      relationTo: "managed-events",
      required: true,
    },
    {
      name: "invitedBy",
      type: "relationship",
      relationTo: "users",
      admin: {
        description: "The member who generated this invite link",
      },
    },
    {
      name: "invitedByChurch",
      type: "relationship",
      relationTo: "churches",
    },
    {
      name: "guest",
      type: "relationship",
      relationTo: "users",
      admin: {
        description: "The guest user created upon registration",
      },
    },
    {
      name: "guestInfo",
      type: "group",
      fields: [
        {
          name: "name",
          type: "text",
        },
        {
          name: "email",
          type: "email",
        },
        {
          name: "phone",
          type: "text",
        },
      ],
    },
    {
      name: "qrCodeUrl",
      type: "text",
      admin: {
        description: "URL to the generated QR code image",
        readOnly: true,
      },
    },
    {
      name: "qrCodeData",
      type: "text",
      admin: {
        description: "Data encoded in the QR code",
        readOnly: true,
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "invited",
      options: [
        { label: "Invited", value: "invited" },
        { label: "Registered", value: "registered" },
        { label: "Waitlisted", value: "waitlisted" },
        { label: "Confirmed from Waitlist", value: "confirmed" },
        { label: "Attended", value: "attended" },
        { label: "Baptized", value: "baptized" },
        { label: "Cancelled", value: "cancelled" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "waitlistPosition",
      type: "number",
      admin: {
        position: "sidebar",
        description: "Position in waitlist (if waitlisted)",
        condition: (data) => data?.status === "waitlisted",
      },
    },
    {
      name: "registeredAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "attendedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        description: "Timestamp when QR was scanned at check-in",
      },
    },
    {
      name: "baptizedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        description: "Timestamp when marked as baptized",
      },
    },
    {
      name: "checkedInBy",
      type: "relationship",
      relationTo: "users",
      admin: {
        description: "User who scanned the QR code at check-in",
      },
    },
    // Reminder tracking
    {
      name: "reminderDayBeforeSent",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Day-before reminder email sent",
      },
    },
    {
      name: "reminderHourBeforeSent",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Hour-before reminder email sent",
      },
    },
    {
      name: "notes",
      type: "textarea",
    },
    {
      name: "importedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        description: "Timestamp when imported via bulk import",
        position: "sidebar",
      },
    },
    {
      name: "promotedFromWaitlistAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        description: "Timestamp when promoted from waitlist",
        position: "sidebar",
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === "create" && !data.inviteCode) {
          // Generate UUID for invite code
          data.inviteCode = crypto.randomUUID();
        }
        return data;
      },
    ],
  },
  timestamps: true,
};
