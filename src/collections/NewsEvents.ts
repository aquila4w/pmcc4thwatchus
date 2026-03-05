import type { CollectionConfig } from "payload";

export const NewsEvents: CollectionConfig = {
  slug: "news-events",
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "type", "eventDate", "isPublished", "showOnHomepage"],
    description: "News (past events/announcements) and Events (upcoming)",
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
    // TYPE SELECTOR (First field, clearly visible)
    // ===================
    {
      name: "type",
      type: "radio",
      required: true,
      defaultValue: "news",
      options: [
        {
          label: "News",
          value: "news",
        },
        {
          label: "Event",
          value: "event",
        },
      ],
      admin: {
        description: "News = past events, announcements, updates. Events = upcoming with registration.",
        layout: "horizontal",
      },
    },

    // ===================
    // BASIC INFO (Both types)
    // ===================
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: "The main title",
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
    // NEWS-SPECIFIC FIELDS
    // ===================
    {
      name: "newsDate",
      type: "date",
      admin: {
        date: { pickerAppearance: "dayOnly" },
        description: "Publication date (for News items)",
        condition: (data) => data?.type === "news",
      },
    },
    {
      name: "content",
      type: "textarea",
      admin: {
        description: "Full news content",
        condition: (data) => data?.type === "news",
      },
    },

    // ===================
    // EVENT-SPECIFIC FIELDS
    // ===================
    // Schedule & Location (Events only)
    {
      type: "tabs",
      tabs: [
        // TAB 1: Schedule & Location (Events only)
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
                    condition: (data) => data?.type === "event",
                  },
                },
                {
                  name: "endDate",
                  type: "date",
                  admin: {
                    date: { pickerAppearance: "dayAndTime" },
                    description: "End date (multi-day events)",
                    width: "50%",
                    condition: (data) => data?.type === "event",
                  },
                },
              ],
            },
            {
              name: "location",
              type: "text",
              required: true,
              admin: {
                description: "Venue name",
                condition: (data) => data?.type === "event",
              },
            },
            {
              name: "address",
              type: "textarea",
              admin: {
                description: "Full street address",
                condition: (data) => data?.type === "event",
              },
            },
            {
              name: "coordinates",
              type: "group",
              admin: {
                description: "For map display",
                condition: (data) => data?.type === "event",
              },
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

        // TAB 2: Images & Media (Both types)
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

        // TAB 3: Registration (Events only)
        {
          label: "Registration",
          fields: [
            {
              name: "requiresRegistration",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description: "Enable event registration",
                condition: (data) => data?.type === "event",
              },
            },
            {
              name: "registrationUrl",
              type: "text",
              admin: {
                description: "External registration link",
                condition: (data) => data?.type === "event" && data?.requiresRegistration,
              },
            },
            {
              name: "registrationDeadline",
              type: "date",
              admin: {
                date: { pickerAppearance: "dayAndTime" },
                description: "Last date to register",
                condition: (data) => data?.type === "event" && data?.requiresRegistration,
              },
            },
            {
              name: "maxAttendees",
              type: "number",
              admin: {
                description: "Max capacity (empty = unlimited)",
                condition: (data) => data?.type === "event" && data?.requiresRegistration,
              },
            },
            {
              name: "registrationNote",
              type: "textarea",
              admin: {
                description: "Additional info for registrants",
                condition: (data) => data?.type === "event" && data?.requiresRegistration,
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
      admin: { position: "sidebar", description: "Publish to site" },
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
      defaultValue: "general",
      options: [
        { label: "General", value: "general" },
        { label: "Conference", value: "conference" },
        { label: "Training", value: "training" },
        { label: "Worship", value: "worship" },
        { label: "Crusade", value: "crusade" },
        { label: "Youth", value: "youth" },
        { label: "Announcement", value: "announcement" },
      ],
      admin: { position: "sidebar", description: "Sub-category" },
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
      admin: {
        position: "sidebar",
        description: "Organizing church (Events only)",
        condition: (data) => data?.type === "event",
      },
    },
    {
      name: "contactEmail",
      type: "email",
      admin: {
        position: "sidebar",
        condition: (data) => data?.type === "event",
      },
    },
    {
      name: "contactPhone",
      type: "text",
      admin: {
        position: "sidebar",
        condition: (data) => data?.type === "event",
      },
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
    afterChange: [
      async ({ doc, req }) => {
        // Update folder paths for associated media
        const payload = req.payload;

        // Get date based on type
        const eventDate = doc.type === 'event'
          ? (doc.eventDate || doc.createdAt)
          : (doc.newsDate || doc.createdAt);

        // Format date as YYYY-MM-DD
        const dateStr = new Date(eventDate).toISOString().split('T')[0];
        const folderPath = `news-events/${dateStr}-${doc.slug}`;

        // Helper function to update media folder
        const updateMediaFolder = async (mediaId: string | null | undefined) => {
          if (!mediaId) return;
          try {
            await payload.update({
              collection: 'media',
              id: mediaId,
              data: {
                folder: folderPath,
                newsEvent: doc.id,
              },
            });
          } catch (error) {
            console.error('Error updating media folder:', error);
          }
        };

        // Update hero image
        if (doc.heroImage) {
          const heroId = typeof doc.heroImage === 'string' ? doc.heroImage : doc.heroImage.id;
          await updateMediaFolder(heroId);
        }

        // Update featured image
        if (doc.featuredImage) {
          const featuredId = typeof doc.featuredImage === 'string' ? doc.featuredImage : doc.featuredImage.id;
          await updateMediaFolder(featuredId);
        }

        // Update gallery images
        if (Array.isArray(doc.gallery)) {
          for (const item of doc.gallery) {
            if (item.image) {
              const imageId = typeof item.image === 'string' ? item.image : item.image.id;
              await updateMediaFolder(imageId);
            }
          }
        }
      },
    ],
  },
};
