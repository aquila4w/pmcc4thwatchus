import type { CollectionConfig } from "payload";
import { layoutBlocks } from "../blocks";

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "slug", "status", "updatedAt"],
    description: "Static pages for the website",
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) {
        return {
          status: { equals: "published" },
        };
      }
      return true;
    },
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "subDistrictCoordinator"].includes(user.role);
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
    },
  },
  fields: [
    // ===================
    // BASIC INFO (always visible)
    // ===================
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: "Page title",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "URL path for this page (e.g., 'about-us' for /about-us)",
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            }
            return value;
          },
        ],
      },
    },

    // ===================
    // TABS FOR ORGANIZATION
    // ===================
    {
      type: "tabs",
      tabs: [
        // TAB 1: Content
        {
          label: "Content",
          fields: [
            {
              name: "contentMode",
              type: "select",
              defaultValue: "blocks",
              options: [
                { label: "Block Builder", value: "blocks" },
                { label: "Visual Page Builder (Puck)", value: "puck" },
                { label: "Rich Text Editor", value: "richtext" },
              ],
              admin: {
                description: "Choose how to build this page",
              },
            },
            {
              name: "layout",
              type: "blocks",
              blocks: layoutBlocks,
              admin: {
                description: "Build your page using these blocks",
                condition: (data) => data?.contentMode === "blocks" || !data?.contentMode,
              },
            },
            {
              name: "puckData",
              type: "json",
              admin: {
                description: "Visual page builder data (edit via Page Builder button)",
                condition: (data) => data?.contentMode === "puck",
              },
            },
            {
              name: "editWithPuck",
              type: "ui",
              admin: {
                condition: (data) => data?.contentMode === "puck",
                components: {
                  Field: "/app/(payload)/admin/components/PuckEditorButton#PuckEditorButton",
                },
              },
            },
            {
              name: "content",
              type: "richText",
              admin: {
                description: "Page content (simple text format)",
                condition: (data) => data?.contentMode === "richtext",
              },
            },
          ],
        },

        // TAB 2: SEO
        {
          label: "SEO & Meta",
          fields: [
            {
              name: "meta",
              type: "group",
              fields: [
                {
                  name: "title",
                  type: "text",
                  admin: {
                    description: "SEO title (defaults to page title)",
                  },
                },
                {
                  name: "description",
                  type: "textarea",
                  admin: {
                    description: "SEO description (shown in search results)",
                  },
                },
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  admin: {
                    description: "Social sharing image (og:image)",
                  },
                },
                {
                  name: "keywords",
                  type: "text",
                  admin: {
                    description: "SEO keywords (comma-separated)",
                  },
                },
              ],
            },
          ],
        },

        // TAB 3: Settings
        {
          label: "Settings",
          fields: [
            {
              name: "showHeader",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Show the site header on this page",
              },
            },
            {
              name: "showFooter",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Show the site footer on this page",
              },
            },
            {
              name: "customCSS",
              type: "code",
              admin: {
                description: "Custom CSS for this page (advanced)",
                language: "css",
              },
            },
          ],
        },
      ],
    },

    // ===================
    // SIDEBAR FIELDS
    // ===================
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
        description: "Page status",
      },
    },
    {
      name: "isHomePage",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Set this page as the homepage",
        position: "sidebar",
      },
    },
    {
      name: "parent",
      type: "relationship",
      relationTo: "pages",
      admin: {
        position: "sidebar",
        description: "Parent page (for nested pages)",
      },
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Display order (lower = first)",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
        description: "Publication date",
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Auto-set published date when publishing
        if (data.status === "published" && !data.publishedAt) {
          data.publishedAt = new Date().toISOString();
        }
        // Auto-generate slug from title if not provided
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
