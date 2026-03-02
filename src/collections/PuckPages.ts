import type { CollectionConfig } from "payload";

export const PuckPages: CollectionConfig = {
  slug: "puck-pages",
  admin: {
    useAsTitle: "name",
    group: "Content",
    defaultColumns: ["name", "slug", "status", "updatedAt"],
    description: "Visual page builder pages created with Puck",
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
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description: "Page title (for admin reference)",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "URL slug (e.g., 'about-us' will be accessible at /p/about-us)",
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            }
            return value;
          },
        ],
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
      admin: {
        position: "sidebar",
        description: "Only published pages are visible to the public",
      },
    },
    {
      name: "puckData",
      type: "json",
      required: true,
      admin: {
        description: "Puck page builder data (JSON)",
        condition: () => false, // Hide from admin UI - managed by page builder
      },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "SEO meta description for this page",
      },
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Featured image for social sharing",
      },
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      admin: {
        position: "sidebar",
        description: "Page author",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        description: "Publication date",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Auto-set published date when publishing
        if (operation === "update" && data.status === "published" && !data.publishedAt) {
          data.publishedAt = new Date().toISOString();
        }
        return data;
      },
    ],
  },
};
