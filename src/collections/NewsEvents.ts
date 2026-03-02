import type { CollectionConfig } from "payload";

export const NewsEvents: CollectionConfig = {
  slug: "news-events",
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "eventDate", "location", "isPublished", "showOnHomepage"],
    description: "Public news and events shown on homepage and events page",
  },
  access: {
    read: () => true,
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
        description: "The main title of the news/event",
      },
    },
    {
      name: "subtitle",
      type: "text",
      admin: {
        description: "A short subtitle or tagline",
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
        description: "Brief description for listings (max 300 chars)",
      },
    },

    // ===================
    // TABS
    // ===================
    {
      type: "tabs",
      tabs: [
        // TAB 1: Schedule & Location
        {
          label: "Schedule & Location",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "eventDate",
                  type: "date",
                  required: true,
                  admin: {
                    date: { pickerAppearance: "dayAndTime" },
                    description: "Start date and time",
                    width: "50%",
                  },
                },
                {
                  name: "endDate",
                  type: "date",
                  admin: {
                    date: { pickerAppearance: "dayAndTime" },
                    description: "End date (multi-day events)",
                    width: "50%",
                  },
                },
              ],
            },
            {
              name: "location",
              type: "text",
              required: true,
              admin: { description: "Venue name" },
            },
            {
              name: "address",
              type: "textarea",
              admin: { description: "Full street address" },
            },
            {
              name: "coordinates",
              type: "group",
              admin: { description: "For map display" },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "lat", type: "number", admin: { width: "50%", description: "Latitude" } },
                    { name: "lng", type: "number", admin: { width: "50%", description: "Longitude" } },
                  ],
                },
              ],
            },
          ],
        },

        // TAB 2: Images & Media
        {
          label: "Images & Media",
          fields: [
            {
              name: "heroImage",
              type: "upload",
              relationTo: "media",
              admin: { description: "Main image (1200x630px)" },
            },
            {
              name: "featuredImage",
              type: "upload",
              relationTo: "media",
              admin: { description: "Secondary image" },
            },
            {
              name: "gallery",
              type: "array",
              admin: { description: "Additional images" },
              fields: [
                { name: "image", type: "upload", relationTo: "media", required: true },
                { name: "caption", type: "text" },
              ],
            },
          ],
        },

        // TAB 3: Page Design (Puck) - DISABLED FOR TESTING
        // {
        //   label: "Page Design",
        //   fields: [
        //     {
        //       name: "puckData",
        //       type: "json",
        //       admin: {
        //         description: "Visual page builder data - Use the Visual Editor button below",
        //       },
        //     },
        //     {
        //       name: "openVisualEditor",
        //       type: "ui",
        //       admin: {
        //         components: {
        //           Field: "/app/(payload)/admin/components/PuckEditorButton#PuckEditorButton",
        //         },
        //       },
        //     },
        //   ],
        // },

        // TAB 3: Registration (was TAB 4)
        {
          label: "Registration",
          fields: [
            {
              name: "requiresRegistration",
              type: "checkbox",
              defaultValue: false,
              admin: { description: "Enable registration" },
            },
            {
              name: "registrationUrl",
              type: "text",
              admin: {
                description: "External registration link",
                condition: (data) => data?.requiresRegistration,
              },
            },
            {
              name: "registrationDeadline",
              type: "date",
              admin: {
                date: { pickerAppearance: "dayAndTime" },
                description: "Last date to register",
                condition: (data) => data?.requiresRegistration,
              },
            },
            {
              name: "maxAttendees",
              type: "number",
              admin: {
                description: "Max capacity (empty = unlimited)",
                condition: (data) => data?.requiresRegistration,
              },
            },
            {
              name: "registrationNote",
              type: "textarea",
              admin: {
                description: "Additional info for registrants",
                condition: (data) => data?.requiresRegistration,
              },
            },
          ],
        },
      ],
    },

    // ===================
    // SIDEBAR
    // ===================
    {
      name: "isPublished",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar", description: "Show on Events page" },
    },
    {
      name: "showOnHomepage",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar", description: "Show on homepage" },
    },
    {
      name: "homepageOrder",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Homepage order (lower = first)",
        condition: (data) => data?.showOnHomepage,
      },
    },
    {
      name: "isFeatured",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar", description: "Feature prominently" },
    },
    {
      name: "eventType",
      type: "select",
      defaultValue: "event",
      options: [
        { label: "Event", value: "event" },
        { label: "News", value: "news" },
        { label: "Announcement", value: "announcement" },
        { label: "Conference", value: "conference" },
        { label: "Training", value: "training" },
        { label: "Worship", value: "worship" },
        { label: "Crusade", value: "crusade" },
        { label: "Youth", value: "youth" },
      ],
      admin: { position: "sidebar", description: "Content type" },
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
      admin: { position: "sidebar" },
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: { position: "sidebar" },
    },
    {
      name: "organizer",
      type: "relationship",
      relationTo: "churches",
      admin: { position: "sidebar", description: "Organizing church" },
    },
    {
      name: "contactEmail",
      type: "email",
      admin: { position: "sidebar" },
    },
    {
      name: "contactPhone",
      type: "text",
      admin: { position: "sidebar" },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data }) => {
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
