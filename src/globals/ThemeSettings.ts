import type { GlobalConfig } from "payload";

export const ThemeSettings: GlobalConfig = {
  slug: "theme-settings",
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
      type: "tabs",
      tabs: [
        {
          label: "Colors",
          fields: [
            {
              name: "primaryColor",
              type: "text",
              defaultValue: "#1a365d",
              admin: {
                description: "Primary brand color (hex code)",
              },
            },
            {
              name: "secondaryColor",
              type: "text",
              defaultValue: "#d4a438",
              admin: {
                description: "Secondary/accent color (hex code)",
              },
            },
            {
              name: "accentColor",
              type: "text",
              defaultValue: "#8b2942",
              admin: {
                description: "Accent color for highlights (hex code)",
              },
            },
            {
              name: "backgroundColor",
              type: "text",
              defaultValue: "#ffffff",
              admin: {
                description: "Background color (hex code)",
              },
            },
            {
              name: "textColor",
              type: "text",
              defaultValue: "#1a1a1a",
              admin: {
                description: "Primary text color (hex code)",
              },
            },
            {
              name: "mutedColor",
              type: "text",
              defaultValue: "#6b7280",
              admin: {
                description: "Muted/secondary text color (hex code)",
              },
            },
          ],
        },
        {
          label: "Typography",
          fields: [
            {
              name: "headingFont",
              type: "select",
              defaultValue: "playfair",
              options: [
                { label: "Playfair Display (Serif)", value: "playfair" },
                { label: "Merriweather (Serif)", value: "merriweather" },
                { label: "Lora (Serif)", value: "lora" },
                { label: "Inter (Sans)", value: "inter" },
                { label: "Montserrat (Sans)", value: "montserrat" },
                { label: "Poppins (Sans)", value: "poppins" },
              ],
            },
            {
              name: "bodyFont",
              type: "select",
              defaultValue: "inter",
              options: [
                { label: "Inter (Sans)", value: "inter" },
                { label: "Open Sans (Sans)", value: "openSans" },
                { label: "Lato (Sans)", value: "lato" },
                { label: "Source Sans Pro (Sans)", value: "sourceSans" },
                { label: "Merriweather (Serif)", value: "merriweather" },
                { label: "Georgia (Serif)", value: "georgia" },
              ],
            },
            {
              name: "baseFontSize",
              type: "number",
              defaultValue: 16,
              admin: {
                description: "Base font size in pixels",
              },
            },
          ],
        },
        {
          label: "Layout",
          fields: [
            {
              name: "borderRadius",
              type: "select",
              defaultValue: "medium",
              options: [
                { label: "None", value: "none" },
                { label: "Small", value: "small" },
                { label: "Medium", value: "medium" },
                { label: "Large", value: "large" },
                { label: "Full", value: "full" },
              ],
            },
            {
              name: "containerWidth",
              type: "select",
              defaultValue: "default",
              options: [
                { label: "Narrow (960px)", value: "narrow" },
                { label: "Default (1200px)", value: "default" },
                { label: "Wide (1440px)", value: "wide" },
                { label: "Full Width", value: "full" },
              ],
            },
            {
              name: "spacing",
              type: "select",
              defaultValue: "comfortable",
              options: [
                { label: "Compact", value: "compact" },
                { label: "Comfortable", value: "comfortable" },
                { label: "Spacious", value: "spacious" },
              ],
            },
          ],
        },
        {
          label: "Effects",
          fields: [
            {
              name: "enableAnimations",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Enable scroll animations and transitions",
              },
            },
            {
              name: "animationStyle",
              type: "select",
              defaultValue: "elegant",
              options: [
                { label: "Subtle", value: "subtle" },
                { label: "Elegant", value: "elegant" },
                { label: "Dynamic", value: "dynamic" },
                { label: "Playful", value: "playful" },
              ],
            },
            {
              name: "enableParallax",
              type: "checkbox",
              defaultValue: true,
            },
            {
              name: "enableSmoothScroll",
              type: "checkbox",
              defaultValue: true,
            },
          ],
        },
        {
          label: "Dark Mode",
          fields: [
            {
              name: "enableDarkMode",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description: "Allow users to toggle dark mode",
              },
            },
            {
              name: "darkPrimaryColor",
              type: "text",
              defaultValue: "#3b82f6",
            },
            {
              name: "darkBackgroundColor",
              type: "text",
              defaultValue: "#0f172a",
            },
            {
              name: "darkTextColor",
              type: "text",
              defaultValue: "#f8fafc",
            },
          ],
        },
      ],
    },
  ],
};
