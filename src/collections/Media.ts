import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Content",
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
    },
  },
  upload: {
    staticDir: "media", // For local development (S3 will override in production)
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        height: 300,
        position: "centre",
      },
      {
        name: "card",
        width: 768,
        height: 1024,
        position: "centre",
      },
      {
        name: "feature",
        width: 1920,
        height: 1080,
        position: "centre",
      },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*", "video/*", "application/pdf"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "caption",
      type: "text",
    },
    {
      name: "folder",
      type: "text",
      admin: {
        description: "Auto-generated folder path (e.g., news-events/2026-03-18-slug)",
        readOnly: true,
      },
    },
    {
      name: "newsEvent",
      type: "relationship",
      relationTo: "news-events",
      admin: {
        description: "Linked news-event for auto-folder organization",
        position: "sidebar",
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Auto-generate folder path from linked news-event
        if (data.newsEvent) {
          const payload = req.payload;
          const newsEventId = typeof data.newsEvent === 'string' ? data.newsEvent : data.newsEvent?.id;

          if (newsEventId) {
            try {
              const newsEvent = await payload.findByID({
                collection: 'news-events',
                id: newsEventId,
                depth: 0,
              });

              if (newsEvent) {
                // Get date based on type
                const eventDate = newsEvent.type === 'event'
                  ? (newsEvent.eventDate || newsEvent.createdAt)
                  : (newsEvent.newsDate || newsEvent.createdAt);

                // Format date as YYYY-MM-DD
                const dateStr = new Date(eventDate).toISOString().split('T')[0];
                const slug = newsEvent.slug || 'unknown';

                // Set folder path
                data.folder = `news-events/${dateStr}-${slug}`;
              }
            } catch (error) {
              console.error('Error fetching news-event for folder:', error);
            }
          }
        }
        return data;
      },
    ],
  },
};
