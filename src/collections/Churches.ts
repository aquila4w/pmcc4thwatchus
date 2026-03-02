import type { CollectionConfig } from "payload";

export const Churches: CollectionConfig = {
  slug: "churches",
  admin: {
    useAsTitle: "name",
    group: "Organization",
    defaultColumns: ["name", "city", "state", "subDistrict"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
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
      admin: {
        description: "URL-friendly identifier for the church",
      },
    },
    {
      name: "address",
      type: "textarea",
    },
    {
      name: "city",
      type: "text",
      required: true,
    },
    {
      name: "state",
      type: "text",
      required: true,
    },
    {
      name: "zip",
      type: "text",
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "email",
      type: "email",
    },
    {
      name: "subDistrict",
      type: "relationship",
      relationTo: "sub-districts",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "headMinister",
      type: "relationship",
      relationTo: "users",
      filterOptions: {
        role: { equals: "headMinister" },
      },
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "secretary",
      type: "relationship",
      relationTo: "users",
      filterOptions: {
        role: { equals: "secretary" },
      },
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "serviceSchedule",
      type: "array",
      fields: [
        {
          name: "day",
          type: "select",
          options: [
            { label: "Sunday", value: "sunday" },
            { label: "Monday", value: "monday" },
            { label: "Tuesday", value: "tuesday" },
            { label: "Wednesday", value: "wednesday" },
            { label: "Thursday", value: "thursday" },
            { label: "Friday", value: "friday" },
            { label: "Saturday", value: "saturday" },
          ],
        },
        {
          name: "time",
          type: "text",
        },
        {
          name: "serviceName",
          type: "text",
        },
      ],
    },
    {
      name: "coordinates",
      type: "group",
      fields: [
        {
          name: "lat",
          type: "number",
        },
        {
          name: "lng",
          type: "number",
        },
      ],
    },
  ],
  timestamps: true,
};
