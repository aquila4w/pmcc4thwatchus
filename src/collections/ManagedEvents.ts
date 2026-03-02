import type { CollectionConfig } from "payload";
import { layoutBlocks } from "../blocks";

export const ManagedEvents: CollectionConfig = {
  slug: "managed-events",
  admin: {
    useAsTitle: "title",
    group: "Event Management",
    defaultColumns: ["title", "startDate", "location", "status", "registrationCount"],
    description: "Admin-only: Manage events with registration, QR codes, and check-in",
  },
  access: {
    read: ({ req: { user } }) => {
      // Only authenticated users can see managed events
      if (!user) return false;
      return true;
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
    // ===================
    // BASIC INFO
    // ===================
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: "Event name",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "URL-friendly identifier for registration links",
      },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Brief description of the event",
      },
    },

    // ===================
    // STATUS
    // ===================
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Open for Registration", value: "registration-open" },
        { label: "Registration Closed", value: "registration-closed" },
        { label: "In Progress", value: "in-progress" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ],
      admin: {
        position: "sidebar",
        description: "Event status",
      },
    },

    // ===================
    // SCHEDULE & LOCATION
    // ===================
    {
      type: "tabs",
      tabs: [
        {
          label: "Schedule & Location",
          fields: [
            {
              name: "startDate",
              type: "date",
              required: true,
              admin: {
                date: {
                  pickerAppearance: "dayAndTime",
                },
                description: "Event start date and time",
              },
            },
            {
              name: "endDate",
              type: "date",
              admin: {
                date: {
                  pickerAppearance: "dayAndTime",
                },
                description: "Event end date and time",
              },
            },
            {
              name: "location",
              type: "text",
              required: true,
              admin: {
                description: "Venue name",
              },
            },
            {
              name: "address",
              type: "textarea",
              admin: {
                description: "Full address of the venue",
              },
            },
            {
              name: "coordinates",
              type: "group",
              admin: {
                description: "For map display",
              },
              fields: [
                { name: "lat", type: "number", admin: { width: "50%" } },
                { name: "lng", type: "number", admin: { width: "50%" } },
              ],
            },
          ],
        },
        {
          label: "Registration Settings",
          fields: [
            {
              name: "registrationEnabled",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Enable online registration for this event",
              },
            },
            {
              name: "registrationDeadline",
              type: "date",
              admin: {
                date: {
                  pickerAppearance: "dayAndTime",
                },
                description: "Last date to register",
              },
            },
            {
              name: "maxAttendees",
              type: "number",
              admin: {
                description: "Maximum number of attendees (leave empty for unlimited)",
              },
            },
            {
              name: "requireApproval",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description: "Require admin approval for registrations",
              },
            },
            {
              name: "hasBaptism",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description: "Does this event include a baptism ceremony?",
              },
            },
            {
              name: "registrationFields",
              type: "array",
              admin: {
                description: "Additional fields to collect during registration",
              },
              fields: [
                {
                  name: "fieldName",
                  type: "text",
                  required: true,
                },
                {
                  name: "fieldType",
                  type: "select",
                  defaultValue: "text",
                  options: [
                    { label: "Text", value: "text" },
                    { label: "Email", value: "email" },
                    { label: "Phone", value: "phone" },
                    { label: "Select", value: "select" },
                    { label: "Checkbox", value: "checkbox" },
                  ],
                },
                {
                  name: "required",
                  type: "checkbox",
                  defaultValue: false,
                },
                {
                  name: "options",
                  type: "text",
                  admin: {
                    description: "Comma-separated options (for select fields)",
                    condition: (data, siblingData) => siblingData?.fieldType === "select",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Registration Page",
          description: "Customize the registration page",
          fields: [
            {
              name: "heroImage",
              type: "upload",
              relationTo: "media",
              admin: {
                description: "Header image for registration page",
              },
            },
            {
              name: "contentMode",
              type: "select",
              defaultValue: "richtext",
              options: [
                { label: "Rich Text Editor", value: "richtext" },
                { label: "Block Builder", value: "blocks" },
                // { label: "Visual Page Builder (Puck)", value: "puck" }, // DISABLED FOR TESTING
              ],
              admin: {
                description: "Choose how to edit content",
              },
            },
            {
              name: "registrationIntro",
              type: "richText",
              admin: {
                description: "Introduction text shown on registration page",
                condition: (data) => data?.contentMode === "richtext" || !data?.contentMode,
              },
            },
            {
              name: "pageLayout",
              type: "blocks",
              blocks: layoutBlocks,
              admin: {
                description: "Additional content blocks for registration page",
                condition: (data) => data?.contentMode === "blocks",
              },
            },
            // {
            //   name: "puckData",
            //   type: "json",
            //   admin: {
            //     description: "Visual page builder data",
            //     condition: (data) => data?.contentMode === "puck",
            //   },
            // },
            // {
            //   name: "editWithPuck",
            //   type: "ui",
            //   admin: {
            //     condition: (data) => data?.contentMode === "puck",
            //     components: {
            //       Field: "/app/(payload)/admin/components/PuckEditorButton#PuckEditorButton",
            //     },
            //   },
            // },
          ],
        },
        {
          label: "Thank You Page",
          fields: [
            {
              name: "thankYouTitle",
              type: "text",
              defaultValue: "Thank You for Registering!",
            },
            {
              name: "thankYouMessage",
              type: "richText",
              admin: {
                description: "Message shown after successful registration",
              },
            },
            {
              name: "showQRCode",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Show QR code on thank you page",
              },
            },
            {
              name: "sendConfirmationEmail",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Send confirmation email with QR code",
              },
            },
          ],
        },
        {
          label: "Check-In Settings",
          fields: [
            {
              name: "checkInEnabled",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Enable QR code check-in for this event",
              },
            },
            {
              name: "allowMultipleCheckIns",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description: "Allow checking in the same QR code multiple times",
              },
            },
            {
              name: "checkInStartTime",
              type: "date",
              admin: {
                date: {
                  pickerAppearance: "dayAndTime",
                },
                description: "When check-in opens (defaults to event start)",
              },
            },
          ],
        },
      ],
    },

    // ===================
    // SIDEBAR FIELDS
    // ===================
    {
      name: "organizer",
      type: "relationship",
      relationTo: "churches",
      admin: {
        position: "sidebar",
        description: "Organizing church",
      },
    },
    {
      name: "eventType",
      type: "select",
      defaultValue: "general",
      options: [
        { label: "General Event", value: "general" },
        { label: "Crusade", value: "crusade" },
        { label: "Conference", value: "conference" },
        { label: "Training", value: "training" },
        { label: "Worship Service", value: "worship" },
        { label: "Youth Event", value: "youth" },
        { label: "Baptism", value: "baptism" },
      ],
      admin: {
        position: "sidebar",
      },
    },

    // Virtual field for registration count (computed)
    {
      name: "registrationCount",
      type: "number",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Total registrations (auto-calculated)",
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.id) return 0;
            try {
              const registrations = await req.payload.find({
                collection: "event-registrations",
                where: {
                  event: { equals: data.id },
                },
                limit: 0,
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
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Auto-generate slug from title if not provided
        if (data.title && !data.slug) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        }
        return data;
      },
    ],
  },
};
