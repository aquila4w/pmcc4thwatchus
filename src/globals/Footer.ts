import type { GlobalConfig } from "payload";

export const Footer: GlobalConfig = {
  slug: "footer",
  admin: {
    group: "Globals",
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
    },
  },
  fields: [
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "tagline",
      type: "text",
      defaultValue: "Holiness & Service Unto The Lord",
    },
    {
      name: "columns",
      type: "array",
      maxRows: 4,
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "links",
          type: "array",
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
            },
            {
              name: "link",
              type: "text",
              required: true,
            },
            {
              name: "external",
              type: "checkbox",
              defaultValue: false,
            },
          ],
        },
      ],
    },
    {
      name: "contactInfo",
      type: "group",
      fields: [
        {
          name: "email",
          type: "email",
        },
        {
          name: "phone",
          type: "text",
        },
        {
          name: "address",
          type: "textarea",
        },
      ],
    },
    {
      name: "socialLinks",
      type: "array",
      fields: [
        {
          name: "platform",
          type: "select",
          options: [
            { label: "Facebook", value: "facebook" },
            { label: "YouTube", value: "youtube" },
            { label: "Instagram", value: "instagram" },
            { label: "Twitter/X", value: "twitter" },
            { label: "Email", value: "email" },
          ],
        },
        {
          name: "url",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "copyright",
      type: "text",
      defaultValue: "Pentecostal Missionary Church of Christ (4th Watch)",
    },
    {
      name: "legalLinks",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "link",
          type: "text",
          required: true,
        },
      ],
    },
  ],
};
