import type { CollectionConfig } from "payload";

export const Campaigns: CollectionConfig = {
  slug: "campaigns",
  admin: {
    useAsTitle: "name",
    group: "Event Management",
    defaultColumns: ["name", "event", "type", "status", "scheduledAt"],
    description: "SMS/Email campaigns for managed events",
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"].includes(user.role);
    },
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"].includes(user.role);
    },
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
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "event",
      type: "relationship",
      relationTo: "managed-events",
      required: true,
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "SMS", value: "sms" },
        { label: "Email", value: "email" },
        { label: "Both", value: "both" },
      ],
    },
    {
      name: "subject",
      type: "text",
      admin: {
        condition: (data) => data?.type === "email" || data?.type === "both",
        description: "Email subject line",
      },
    },
    {
      name: "smsContent",
      type: "textarea",
      admin: {
        condition: (data) => data?.type === "sms" || data?.type === "both",
        description: "SMS message (max 160 characters recommended). Use {{name}}, {{event}}, {{qrLink}} as placeholders.",
      },
    },
    {
      name: "emailContent",
      type: "richText",
      admin: {
        condition: (data) => data?.type === "email" || data?.type === "both",
        description: "Email body. Use {{name}}, {{event}}, {{qrLink}}, {{eventDate}}, {{eventLocation}} as placeholders.",
      },
    },
    {
      name: "frequency",
      type: "select",
      defaultValue: "once",
      options: [
        { label: "Send Once", value: "once" },
        { label: "Daily", value: "daily" },
        { label: "Weekly", value: "weekly" },
        { label: "Custom Schedule", value: "custom" },
      ],
    },
    {
      name: "scheduledAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        description: "When to send the campaign",
      },
    },
    {
      name: "customSchedule",
      type: "array",
      admin: {
        condition: (data) => data?.frequency === "custom",
      },
      fields: [
        {
          name: "sendAt",
          type: "date",
          admin: {
            date: {
              pickerAppearance: "dayAndTime",
            },
          },
        },
        {
          name: "sent",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
    {
      name: "targetAudience",
      type: "select",
      defaultValue: "all",
      options: [
        { label: "All Registered Guests", value: "all" },
        { label: "Not Yet Attended", value: "notAttended" },
        { label: "Attended", value: "attended" },
        { label: "Not Baptized", value: "notBaptized" },
      ],
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Scheduled", value: "scheduled" },
        { label: "Sending", value: "sending" },
        { label: "Sent", value: "sent" },
        { label: "Cancelled", value: "cancelled" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "sentCount",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "lastSentAt",
      type: "date",
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
  ],
  timestamps: true,
};
