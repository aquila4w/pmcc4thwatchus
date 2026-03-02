import type { Block } from "payload";

// Hero Block
export const HeroBlock: Block = {
  slug: "hero",
  labels: {
    singular: "Hero",
    plural: "Heroes",
  },
  fields: [
    {
      name: "type",
      type: "select",
      defaultValue: "image",
      options: [
        { label: "Image Background", value: "image" },
        { label: "Video Background", value: "video" },
        { label: "Slider", value: "slider" },
        { label: "Animated", value: "animated" },
      ],
    },
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "subheading",
      type: "text",
    },
    {
      name: "backgroundImage",
      type: "upload",
      relationTo: "media",
      admin: {
        condition: (_, siblingData) => siblingData?.type === "image" || siblingData?.type === "animated",
      },
    },
    {
      name: "videoUrl",
      type: "text",
      admin: {
        condition: (_, siblingData) => siblingData?.type === "video",
      },
    },
    {
      name: "slides",
      type: "array",
      admin: {
        condition: (_, siblingData) => siblingData?.type === "slider",
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "heading",
          type: "text",
        },
        {
          name: "subheading",
          type: "text",
        },
      ],
    },
    {
      name: "buttons",
      type: "array",
      maxRows: 2,
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
          name: "variant",
          type: "select",
          defaultValue: "primary",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" },
            { label: "Outline", value: "outline" },
          ],
        },
      ],
    },
    {
      name: "overlay",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "overlayOpacity",
      type: "number",
      min: 0,
      max: 100,
      defaultValue: 50,
    },
    {
      name: "height",
      type: "select",
      defaultValue: "full",
      options: [
        { label: "Full Screen", value: "full" },
        { label: "Large", value: "large" },
        { label: "Medium", value: "medium" },
      ],
    },
    {
      name: "textAlign",
      type: "select",
      defaultValue: "center",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  ],
};

// Text Block
export const TextBlock: Block = {
  slug: "text",
  labels: {
    singular: "Text",
    plural: "Text Blocks",
  },
  fields: [
    {
      name: "content",
      type: "richText",
      required: true,
    },
    {
      name: "backgroundColor",
      type: "text",
      admin: {
        description: "CSS color value (e.g., #ffffff, transparent)",
      },
    },
    {
      name: "textAlign",
      type: "select",
      defaultValue: "left",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    {
      name: "maxWidth",
      type: "select",
      defaultValue: "default",
      options: [
        { label: "Default", value: "default" },
        { label: "Narrow", value: "narrow" },
        { label: "Wide", value: "wide" },
        { label: "Full Width", value: "full" },
      ],
    },
  ],
};

// Image Block
export const ImageBlock: Block = {
  slug: "image",
  labels: {
    singular: "Image",
    plural: "Images",
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
    {
      name: "size",
      type: "select",
      defaultValue: "default",
      options: [
        { label: "Default", value: "default" },
        { label: "Full Width", value: "full" },
        { label: "Wide", value: "wide" },
      ],
    },
    {
      name: "link",
      type: "text",
    },
  ],
};

// Video Block
export const VideoBlock: Block = {
  slug: "video",
  labels: {
    singular: "Video",
    plural: "Videos",
  },
  fields: [
    {
      name: "source",
      type: "select",
      defaultValue: "youtube",
      options: [
        { label: "YouTube", value: "youtube" },
        { label: "Vimeo", value: "vimeo" },
        { label: "Self-Hosted", value: "selfHosted" },
      ],
    },
    {
      name: "url",
      type: "text",
      required: true,
    },
    {
      name: "poster",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "autoplay",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};

// Columns Block
export const ColumnsBlock: Block = {
  slug: "columns",
  labels: {
    singular: "Columns",
    plural: "Column Sections",
  },
  fields: [
    {
      name: "layout",
      type: "select",
      defaultValue: "two",
      options: [
        { label: "Two Columns", value: "two" },
        { label: "Three Columns", value: "three" },
        { label: "Four Columns", value: "four" },
        { label: "Sidebar Left", value: "sidebarLeft" },
        { label: "Sidebar Right", value: "sidebarRight" },
      ],
    },
    {
      name: "columns",
      type: "array",
      fields: [
        {
          name: "content",
          type: "richText",
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
        },
      ],
    },
    {
      name: "gap",
      type: "select",
      defaultValue: "medium",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "small" },
        { label: "Medium", value: "medium" },
        { label: "Large", value: "large" },
      ],
    },
  ],
};

// Cards Block
export const CardsBlock: Block = {
  slug: "cards",
  labels: {
    singular: "Cards",
    plural: "Card Sections",
  },
  fields: [
    {
      name: "type",
      type: "select",
      defaultValue: "service",
      options: [
        { label: "Service Cards", value: "service" },
        { label: "Team Cards", value: "team" },
        { label: "Testimonial Cards", value: "testimonial" },
        { label: "Feature Cards", value: "feature" },
      ],
    },
    {
      name: "heading",
      type: "text",
    },
    {
      name: "cards",
      type: "array",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "subtitle",
          type: "text",
        },
        {
          name: "description",
          type: "textarea",
        },
        {
          name: "link",
          type: "text",
        },
      ],
    },
    {
      name: "columns",
      type: "select",
      defaultValue: "three",
      options: [
        { label: "Two", value: "two" },
        { label: "Three", value: "three" },
        { label: "Four", value: "four" },
      ],
    },
  ],
};

// Events List Block
export const EventsListBlock: Block = {
  slug: "eventsList",
  labels: {
    singular: "Events List",
    plural: "Events Lists",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      defaultValue: "Upcoming Events",
    },
    {
      name: "type",
      type: "select",
      defaultValue: "upcoming",
      options: [
        { label: "Upcoming", value: "upcoming" },
        { label: "Past", value: "past" },
        { label: "All", value: "all" },
      ],
    },
    {
      name: "limit",
      type: "number",
      defaultValue: 6,
    },
    {
      name: "layout",
      type: "select",
      defaultValue: "grid",
      options: [
        { label: "Grid", value: "grid" },
        { label: "List", value: "list" },
        { label: "Timeline", value: "timeline" },
      ],
    },
  ],
};

// Posts Grid Block
export const PostsGridBlock: Block = {
  slug: "postsGrid",
  labels: {
    singular: "Posts Grid",
    plural: "Posts Grids",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      defaultValue: "Latest News",
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: {
        description: "Filter by categories (leave empty for all)",
      },
    },
    {
      name: "limit",
      type: "number",
      defaultValue: 6,
    },
    {
      name: "columns",
      type: "select",
      defaultValue: "three",
      options: [
        { label: "Two", value: "two" },
        { label: "Three", value: "three" },
        { label: "Four", value: "four" },
      ],
    },
    {
      name: "showExcerpt",
      type: "checkbox",
      defaultValue: true,
    },
  ],
};

// Call to Action Block
export const CTABlock: Block = {
  slug: "cta",
  labels: {
    singular: "Call to Action",
    plural: "CTAs",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "text",
      type: "textarea",
    },
    {
      name: "buttons",
      type: "array",
      maxRows: 2,
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
          name: "variant",
          type: "select",
          defaultValue: "primary",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" },
            { label: "Outline", value: "outline" },
          ],
        },
      ],
    },
    {
      name: "backgroundImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "backgroundColor",
      type: "text",
    },
  ],
};

// Form Block
export const FormBlock: Block = {
  slug: "form",
  labels: {
    singular: "Form",
    plural: "Forms",
  },
  fields: [
    {
      name: "type",
      type: "select",
      defaultValue: "contact",
      options: [
        { label: "Contact Form", value: "contact" },
        { label: "Newsletter Signup", value: "newsletter" },
        { label: "Prayer Request", value: "prayer" },
        { label: "Event RSVP", value: "rsvp" },
      ],
    },
    {
      name: "heading",
      type: "text",
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "submitLabel",
      type: "text",
      defaultValue: "Submit",
    },
    {
      name: "successMessage",
      type: "text",
      defaultValue: "Thank you for your submission!",
    },
  ],
};

// Map Block
export const MapBlock: Block = {
  slug: "map",
  labels: {
    singular: "Map",
    plural: "Maps",
  },
  fields: [
    {
      name: "address",
      type: "text",
      required: true,
    },
    {
      name: "height",
      type: "number",
      defaultValue: 400,
      admin: {
        description: "Height in pixels",
      },
    },
    {
      name: "zoom",
      type: "number",
      defaultValue: 15,
      min: 1,
      max: 20,
    },
  ],
};

// Accordion Block
export const AccordionBlock: Block = {
  slug: "accordion",
  labels: {
    singular: "Accordion",
    plural: "Accordions",
  },
  fields: [
    {
      name: "heading",
      type: "text",
    },
    {
      name: "items",
      type: "array",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "content",
          type: "richText",
          required: true,
        },
      ],
    },
    {
      name: "allowMultiple",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Allow multiple items to be open at once",
      },
    },
  ],
};

// Timeline Block
export const TimelineBlock: Block = {
  slug: "timeline",
  labels: {
    singular: "Timeline",
    plural: "Timelines",
  },
  fields: [
    {
      name: "heading",
      type: "text",
    },
    {
      name: "items",
      type: "array",
      fields: [
        {
          name: "date",
          type: "text",
          required: true,
        },
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "richText",
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
        },
      ],
    },
  ],
};

// Stats Block
export const StatsBlock: Block = {
  slug: "stats",
  labels: {
    singular: "Stats",
    plural: "Stats Sections",
  },
  fields: [
    {
      name: "heading",
      type: "text",
    },
    {
      name: "stats",
      type: "array",
      fields: [
        {
          name: "value",
          type: "text",
          required: true,
        },
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "prefix",
          type: "text",
        },
        {
          name: "suffix",
          type: "text",
        },
      ],
    },
    {
      name: "backgroundColor",
      type: "text",
    },
  ],
};

// Spacer Block
export const SpacerBlock: Block = {
  slug: "spacer",
  labels: {
    singular: "Spacer",
    plural: "Spacers",
  },
  fields: [
    {
      name: "height",
      type: "select",
      defaultValue: "medium",
      options: [
        { label: "Small (32px)", value: "small" },
        { label: "Medium (64px)", value: "medium" },
        { label: "Large (128px)", value: "large" },
        { label: "Extra Large (256px)", value: "xlarge" },
      ],
    },
  ],
};

// Custom HTML Block
export const CustomHtmlBlock: Block = {
  slug: "customHtml",
  labels: {
    singular: "Custom HTML",
    plural: "Custom HTML Blocks",
  },
  fields: [
    {
      name: "html",
      type: "code",
      required: true,
      admin: {
        language: "html",
      },
    },
  ],
};

// Export all blocks
export const layoutBlocks: Block[] = [
  HeroBlock,
  TextBlock,
  ImageBlock,
  VideoBlock,
  ColumnsBlock,
  CardsBlock,
  EventsListBlock,
  PostsGridBlock,
  CTABlock,
  FormBlock,
  MapBlock,
  AccordionBlock,
  TimelineBlock,
  StatsBlock,
  SpacerBlock,
  CustomHtmlBlock,
];
