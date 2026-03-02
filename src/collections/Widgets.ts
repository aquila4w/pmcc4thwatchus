import type { CollectionConfig } from "payload";

export const Widgets: CollectionConfig = {
  slug: "widgets",
  admin: {
    useAsTitle: "name",
    group: "Content",
    defaultColumns: ["name", "type", "placement", "order"],
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
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Recent Posts", value: "recentPosts" },
        { label: "Categories", value: "categories" },
        { label: "Upcoming Events", value: "upcomingEvents" },
        { label: "Newsletter Signup", value: "newsletter" },
        { label: "Custom HTML", value: "customHtml" },
        { label: "Social Links", value: "socialLinks" },
        { label: "Search", value: "search" },
        { label: "Tags Cloud", value: "tagsCloud" },
        { label: "Featured Image", value: "featuredImage" },
      ],
    },
    {
      name: "placement",
      type: "select",
      required: true,
      defaultValue: "sidebar",
      options: [
        { label: "Blog Sidebar", value: "sidebar" },
        { label: "Footer", value: "footer" },
        { label: "Header", value: "header" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Order of appearance (lower = first)",
      },
    },
    {
      name: "isActive",
      type: "checkbox",
      defaultValue: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "title",
      type: "text",
      admin: {
        description: "Widget title displayed on frontend",
      },
    },
    {
      name: "customHtml",
      type: "code",
      admin: {
        condition: (data) => data?.type === "customHtml",
        language: "html",
      },
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      admin: {
        condition: (data) => data?.type === "featuredImage",
      },
    },
    {
      name: "imageLink",
      type: "text",
      admin: {
        condition: (data) => data?.type === "featuredImage",
        description: "URL to link to when image is clicked",
      },
    },
    {
      name: "postsCount",
      type: "number",
      defaultValue: 5,
      admin: {
        condition: (data) => data?.type === "recentPosts",
        description: "Number of posts to display",
      },
    },
    {
      name: "eventsCount",
      type: "number",
      defaultValue: 3,
      admin: {
        condition: (data) => data?.type === "upcomingEvents",
        description: "Number of events to display",
      },
    },
  ],
  timestamps: true,
};
