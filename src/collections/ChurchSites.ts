import type { CollectionConfig } from "payload";

export const ChurchSites: CollectionConfig = {
  slug: "church-sites",
  admin: {
    useAsTitle: "church",
    group: "Church Websites",
    defaultColumns: ["church", "template", "published", "updatedAt"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"].includes(user.role);
    },
    readVersions: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"].includes(user.role);
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (["superAdmin", "districtCoordinator"].includes(user.role)) return true;
      // Head ministers and secretaries can only edit their own church's site
      if (["headMinister", "secretary", "subDistrictCoordinator"].includes(user.role)) return true;
      return false;
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator"].includes(user.role);
    },
  },
  fields: [
    {
      name: "church",
      type: "relationship",
      relationTo: "churches",
      required: true,
      unique: true,
      admin: {
        description: "The church this website belongs to. The church's slug determines the subdomain (e.g., seattle.pmcc4thwatch.us).",
      },
    },
    {
      name: "published",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Publish the church website. Unpublished sites show a coming soon page.",
        position: "sidebar",
      },
    },
    {
      name: "template",
      type: "select",
      required: true,
      defaultValue: "modern",
      options: [
        { label: "Modern (Navy & Gold)", value: "modern" },
        { label: "Classic (Brown & Warm)", value: "classic" },
        { label: "Bold (Dark & Orange)", value: "bold" },
        { label: "Warm (Green & Amber)", value: "warm" },
        { label: "Grace (Lavender & White)", value: "grace" },
        { label: "Heritage (Deep Red & Cream)", value: "heritage" },
        { label: "Radiance (Sunrise Gold)", value: "radiance" },
        { label: "Harmony (Teal & Coral)", value: "harmony" },
        { label: "Summit (Steel Blue & Silver)", value: "summit" },
        { label: "Ember (Burgundy & Copper)", value: "ember" },
        { label: "Covenant (Indigo & White)", value: "covenant" },
        { label: "Oasis (Desert Tan & Teal)", value: "oasis" },
        { label: "Gathering (Plum & Gold)", value: "gathering" },
        { label: "Horizon (Ocean Blue & Sand)", value: "horizon" },
        { label: "Elevation (Charcoal & Lime)", value: "elevation" },
        { label: "Sanctuary (Forest & Cream)", value: "sanctuary" },
        { label: "Pinnacle (Slate & Rose)", value: "pinnacle" },
        { label: "Cornerstone (Stone Gray & Navy)", value: "cornerstone" },
        { label: "Daybreak (Dawn Pink & White)", value: "daybreak" },
        { label: "Heritage Gold (Black & Gold)", value: "heritageGold" },
      ],
      admin: {
        description: "Design template for the church website.",
        position: "sidebar",
      },
    },
    // --- Home Page Content ---
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Main hero image shown on the church homepage.",
      },
    },
    {
      name: "welcomeTitle",
      type: "text",
      defaultValue: "Welcome to Our Church",
      admin: {
        description: "Title displayed on the homepage hero section.",
      },
    },
    {
      name: "welcomeText",
      type: "richText",
      admin: {
        description: "Welcome message displayed on the homepage.",
      },
    },
    {
      name: "missionStatement",
      type: "textarea",
      admin: {
        description: "Short mission statement displayed on the homepage.",
      },
    },
    // --- Service Schedule ---
    {
      name: "serviceSchedule",
      type: "array",
      labels: {
        singular: "Service",
        plural: "Service Schedule",
      },
      fields: [
        {
          name: "day",
          type: "select",
          required: true,
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
          required: true,
        },
        {
          name: "serviceName",
          type: "text",
          required: true,
        },
      ],
      admin: {
        description: "Weekly service schedule displayed on the homepage.",
      },
    },
    // --- Pastors / Leaders ---
    {
      name: "pastors",
      type: "array",
      labels: {
        singular: "Pastor / Leader",
        plural: "Pastors & Leaders",
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "title",
          type: "text",
          admin: {
            description: "Title or role (e.g., Head Minister, Associate Minister)",
          },
        },
        {
          name: "photo",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "bio",
          type: "textarea",
        },
      ],
    },
    // --- About Page ---
    {
      name: "aboutContent",
      type: "richText",
      admin: {
        description: "Content for the About page.",
      },
    },
    {
      name: "history",
      type: "richText",
      admin: {
        description: "Church history section for the About page.",
      },
    },
    {
      name: "beliefs",
      type: "richText",
      admin: {
        description: "Core beliefs section for the About page.",
      },
    },
    // --- Gallery ---
    {
      name: "gallery",
      type: "array",
      labels: {
        singular: "Gallery Image",
        plural: "Gallery",
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
    // --- Social Links ---
    {
      name: "socialLinks",
      type: "group",
      fields: [
        {
          name: "facebook",
          type: "text",
          admin: {
            description: "Facebook page URL",
          },
        },
        {
          name: "instagram",
          type: "text",
          admin: {
            description: "Instagram profile URL",
          },
        },
        {
          name: "youtube",
          type: "text",
          admin: {
            description: "YouTube channel URL",
          },
        },
        {
          name: "website",
          type: "text",
          admin: {
            description: "External website URL (if any)",
          },
        },
      ],
    },
    // --- Custom Colors ---
    {
      name: "customColors",
      type: "group",
      fields: [
        {
          name: "primaryColor",
          type: "text",
          admin: {
            description: "Primary brand color (hex, e.g., #1a365d)",
          },
        },
        {
          name: "accentColor",
          type: "text",
          admin: {
            description: "Accent color (hex, e.g., #c9a84c)",
          },
        },
      ],
    },
    // --- Latest Updates ---
    {
      name: "latestUpdates",
      type: "array",
      labels: {
        singular: "Update",
        plural: "Latest Updates",
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "content",
          type: "textarea",
        },
        {
          name: "date",
          type: "date",
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "link",
          type: "text",
          admin: {
            description: "Optional link for more details",
          },
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
  timestamps: true,
};
