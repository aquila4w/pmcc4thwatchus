import type { CollectionConfig } from "payload";

export const SubDistricts: CollectionConfig = {
  slug: "sub-districts",
  admin: {
    useAsTitle: "name",
    group: "Organization",
    defaultColumns: ["name", "number", "coordinator"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return user.role === "superAdmin";
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "number",
      type: "number",
      required: true,
      min: 1,
      max: 8,
      admin: {
        description: "SubDistrict number (1-8)",
      },
    },
    {
      name: "coordinator",
      type: "relationship",
      relationTo: "users",
      filterOptions: {
        role: { equals: "subDistrictCoordinator" },
      },
    },
    {
      name: "description",
      type: "textarea",
    },
  ],
  timestamps: true,
};
