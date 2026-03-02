import type { CollectionConfig } from "payload";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "name",
    group: "Content",
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
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "parent",
      type: "relationship",
      relationTo: "categories",
      admin: {
        description: "Parent category for nesting",
      },
    },
    {
      name: "color",
      type: "text",
      admin: {
        description: "Optional color for the category (hex code)",
      },
    },
  ],
  timestamps: true,
};
