import type { GlobalConfig } from "payload";

export const Header: GlobalConfig = {
  slug: "header",
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
      name: "logoText",
      type: "text",
      defaultValue: "PMCC 4th Watch",
    },
    {
      name: "navigation",
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
          admin: {
            description: "URL or path (e.g., /about or https://example.com)",
          },
        },
        {
          name: "type",
          type: "select",
          defaultValue: "link",
          options: [
            { label: "Link", value: "link" },
            { label: "Dropdown", value: "dropdown" },
          ],
        },
        {
          name: "children",
          type: "array",
          admin: {
            condition: (_, siblingData) => siblingData?.type === "dropdown",
          },
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
              name: "description",
              type: "text",
            },
            {
              name: "icon",
              type: "text",
              admin: {
                description: "Icon name (e.g., lucide icon name)",
              },
            },
          ],
        },
      ],
    },
    {
      name: "ctaButton",
      type: "group",
      fields: [
        {
          name: "show",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "label",
          type: "text",
          defaultValue: "Contact Us",
        },
        {
          name: "link",
          type: "text",
          defaultValue: "/contact",
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
      name: "transparent",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Make header transparent on hero sections",
      },
    },
  ],
};
