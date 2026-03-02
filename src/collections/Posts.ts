import type { CollectionConfig } from "payload";
import { layoutBlocks } from "../blocks";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "author", "status", "publishedAt"],
    description: "Blog posts and articles",
  },
  access: {
    read: ({ req: { user } }) => {
      // Published posts are public
      if (!user) {
        return {
          status: { equals: "published" },
        };
      }
      return true;
    },
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
    // BASIC INFO (always visible)
    // ===================
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: "The main title of the post",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "URL-friendly identifier (e.g., 'my-blog-post')",
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
    {
      name: "excerpt",
      type: "textarea",
      admin: {
        description: "Brief summary of the post (shown in listings)",
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
              defaultValue: "richtext",
              options: [
                { label: "Rich Text Editor", value: "richtext" },
                { label: "Block Builder", value: "blocks" },
                // { label: "Visual Page Builder (Puck)", value: "puck" }, // DISABLED FOR TESTING
              ],
              admin: {
                description: "Choose how to edit content",
              },
            },
            {
              name: "content",
              type: "richText",
              admin: {
                description: "Main content of the blog post",
                condition: (data) => data?.contentMode === "richtext" || !data?.contentMode,
              },
            },
            {
              name: "pageLayout",
              type: "blocks",
              blocks: layoutBlocks,
              admin: {
                description: "Build custom page sections with blocks",
                condition: (data) => data?.contentMode === "blocks",
              },
            },
            // {
            //   name: "puckData",
            //   type: "json",
            //   admin: {
            //     description: "Visual page builder data (edit via Page Builder button)",
            //     condition: (data) => data?.contentMode === "puck",
            //   },
            // },
            // {
            //   name: "editWithPuck",
            //   type: "ui",
            //   admin: {
            //     condition: (data) => data?.contentMode === "puck",
            //     components: {
            //       Field: "/app/(payload)/admin/components/PuckEditorButton#PuckEditorButton",
            //     },
            //   },
            // },
          ],
        },

        // TAB 2: Media
        {
          label: "Media",
          fields: [
            {
              name: "featuredImage",
              type: "upload",
              relationTo: "media",
              admin: {
                description: "Main image for the post (shown in listings and header)",
              },
            },
            {
              name: "gallery",
              type: "array",
              admin: {
                description: "Additional images for the post",
              },
              fields: [
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  required: true,
                },
                {
                  name: "caption",
                  type: "text",
                },
              ],
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
        description: "Post status",
      },
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      admin: {
        position: "sidebar",
        description: "Post author",
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
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: {
        position: "sidebar",
        description: "Post categories",
      },
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
      admin: {
        position: "sidebar",
        description: "Post tags",
      },
    },
    {
      name: "isFeatured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Feature this post on the homepage",
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
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
