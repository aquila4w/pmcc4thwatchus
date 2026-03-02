import type { CollectionConfig } from "payload";

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: {
    useAsTitle: "name",
    group: "Content",
    description: "Manage tags for events and news",
    defaultColumns: ["name", "slug", "color"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister"].includes(user.role);
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister"].includes(user.role);
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
        description: "Tag name (e.g., 'Conference', 'Youth', 'Prayer')",
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
        description: "Optional description for this tag",
      },
    },
    {
      name: "color",
      type: "text",
      defaultValue: "#D4A438",
      admin: {
        description: "Color for the tag badge (hex code, e.g., #D4A438)",
      },
    },
    {
      name: "icon",
      type: "text",
      admin: {
        description: "Optional icon name (e.g., 'calendar', 'users', 'heart')",
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Auto-generate slug from name if not provided
        if (data.name && !data.slug) {
          data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        }
        return data;
      },
    ],
  },
};
