import type { CollectionConfig } from "payload";

export const InviteScans: CollectionConfig = {
  slug: "invite-scans",
  admin: {
    useAsTitle: "inviteCode",
    group: "Event Management",
    defaultColumns: ["inviteCode", "inviteType", "event", "device", "scannedAt"],
    description: "Visit/scan tracking for both member and church invite QR codes",
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "eventAdmin"].includes(user.role);
    },
    create: () => true, // Public — registration page records scans
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ["superAdmin", "districtCoordinator", "eventAdmin"].includes(user.role);
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return user.role === "superAdmin";
    },
  },
  fields: [
    {
      name: "inviteType",
      type: "select",
      required: true,
      options: [
        { label: "Member Invite", value: "member" },
        { label: "Church Ad", value: "church" },
        { label: "Online Platform", value: "platform" },
      ],
      admin: {
        description: "Whether the scan came from a member invite or church ad QR",
      },
    },
    {
      name: "inviteCode",
      type: "text",
      required: true,
      index: true,
      admin: {
        description: "The code from the scanned QR URL",
      },
    },
    // Relationships (one will be populated depending on inviteType)
    {
      name: "eventInvite",
      type: "relationship",
      relationTo: "event-invites",
      admin: {
        description: "Linked event invite (for member scans)",
      },
    },
    {
      name: "churchEventInvite",
      type: "relationship",
      relationTo: "church-event-invites",
      admin: {
        description: "Linked church event invite (for church ad scans)",
      },
    },
    {
      name: "platformEventLink",
      type: "relationship",
      relationTo: "platform-event-links",
      admin: {
        description: "Linked platform event link (for online platform scans)",
      },
    },
    {
      name: "event",
      type: "relationship",
      relationTo: "managed-events",
      required: true,
      index: true,
      admin: {
        description: "The event this scan relates to",
      },
    },
    // Denormalized for fast analytics queries
    {
      name: "church",
      type: "relationship",
      relationTo: "churches",
      admin: {
        description: "Church (denormalized for analytics)",
      },
    },
    {
      name: "adPlacement",
      type: "relationship",
      relationTo: "ad-placements",
      admin: {
        description: "Ad placement (for church scans)",
      },
    },
    // Device tracking
    {
      name: "ipAddress",
      type: "text",
      admin: {
        description: "Client IP address",
      },
    },
    {
      name: "city",
      type: "text",
      admin: {
        description: "City from IP geolocation",
      },
    },
    {
      name: "region",
      type: "text",
      admin: {
        description: "State/region from IP geolocation",
      },
    },
    {
      name: "country",
      type: "text",
      admin: {
        description: "Country from IP geolocation",
      },
    },
    {
      name: "userAgent",
      type: "text",
      admin: {
        description: "Raw User-Agent header",
      },
    },
    {
      name: "device",
      type: "text",
      admin: {
        description: "Parsed device type (mobile/tablet/desktop)",
      },
    },
    {
      name: "os",
      type: "text",
      admin: {
        description: "Parsed operating system",
      },
    },
    {
      name: "browser",
      type: "text",
      admin: {
        description: "Parsed browser name",
      },
    },

    // === Attribution ===
    {
      name: "referrer",
      type: "text",
      admin: { description: "HTTP Referer header — where the visitor came from" },
    },
    {
      name: "utmSource",
      type: "text",
      index: true,
      admin: { description: "utm_source query parameter" },
    },
    {
      name: "utmMedium",
      type: "text",
      admin: { description: "utm_medium query parameter" },
    },
    {
      name: "utmCampaign",
      type: "text",
      index: true,
      admin: { description: "utm_campaign query parameter" },
    },
    {
      name: "utmContent",
      type: "text",
      admin: { description: "utm_content query parameter" },
    },
    {
      name: "utmTerm",
      type: "text",
      admin: { description: "utm_term query parameter" },
    },
    {
      name: "pageUrl",
      type: "text",
      admin: { description: "Full URL the visitor arrived at" },
    },

    // === Display & Locale ===
    {
      name: "language",
      type: "text",
      index: true,
      admin: { description: "Browser language (Accept-Language)" },
    },
    {
      name: "timezone",
      type: "text",
      admin: { description: "Browser timezone (e.g. America/Los_Angeles)" },
    },
    {
      name: "screenWidth",
      type: "number",
      admin: { description: "Screen width in pixels" },
    },
    {
      name: "screenHeight",
      type: "number",
      admin: { description: "Screen height in pixels" },
    },
    {
      name: "colorDepth",
      type: "number",
      admin: { description: "Screen color depth (bits)" },
    },
    {
      name: "pixelRatio",
      type: "number",
      admin: { description: "Device pixel ratio" },
    },

    // === Hardware Fingerprinting ===
    {
      name: "gpuVendor",
      type: "text",
      admin: { description: "WebGL GPU vendor" },
    },
    {
      name: "gpuRenderer",
      type: "text",
      admin: { description: "WebGL GPU renderer" },
    },
    {
      name: "cpuCores",
      type: "number",
      admin: { description: "navigator.hardwareConcurrency" },
    },
    {
      name: "deviceMemory",
      type: "number",
      admin: { description: "navigator.deviceMemory (GB, Chrome only)" },
    },
    {
      name: "touchSupport",
      type: "text",
      admin: { description: "Touch capability (maxTouchPoints + touch events)" },
    },
    {
      name: "canvasHash",
      type: "text",
      index: true,
      admin: { description: "Hash of canvas-rendered fingerprint" },
    },
    {
      name: "audioHash",
      type: "text",
      index: true,
      admin: { description: "Hash of AudioContext fingerprint" },
    },

    // === Network Intelligence ===
    {
      name: "connectionType",
      type: "text",
      admin: { description: "Connection type (4g/3g/2g/slow-2g)" },
    },
    {
      name: "connectionDownlink",
      type: "number",
      admin: { description: "Downlink speed in Mbps" },
    },
    {
      name: "connectionRtt",
      type: "number",
      admin: { description: "Round-trip time in ms" },
    },

    // === Browser Environment ===
    {
      name: "doNotTrack",
      type: "text",
      admin: { description: "navigator.doNotTrack value" },
    },
    {
      name: "cookiesEnabled",
      type: "checkbox",
      admin: { description: "Whether cookies are enabled" },
    },
    {
      name: "adBlockerDetected",
      type: "checkbox",
      admin: { description: "Whether an ad blocker was detected" },
    },
    {
      name: "localStorageAvailable",
      type: "checkbox",
      admin: { description: "Whether localStorage is available" },
    },
    {
      name: "platform",
      type: "text",
      admin: { description: "navigator.platform" },
    },

    // === Behavioral Analytics ===
    {
      name: "timeOnPage",
      type: "number",
      admin: { description: "Seconds from page load to registration submit" },
    },
    {
      name: "formStartDelay",
      type: "number",
      admin: { description: "Seconds until first form field focused" },
    },
    {
      name: "scrollDepth",
      type: "number",
      admin: { description: "Max scroll percentage reached (0-100)" },
    },
    {
      name: "rageClickDetected",
      type: "checkbox",
      admin: { description: "3+ clicks within 500ms on same element" },
    },

    // Timing
    {
      name: "scannedAt",
      type: "date",
      required: true,
      defaultValue: new Date().toISOString(),
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        description: "When the QR was scanned / page loaded",
      },
    },
    // Conversion tracking
    {
      name: "registered",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Whether this scan resulted in a registration",
        position: "sidebar",
      },
    },
    {
      name: "registeredAt",
      type: "date",
      admin: {
        date: { pickerAppearance: "dayAndTime" },
        description: "When the registration was completed",
        position: "sidebar",
      },
    },
    {
      name: "registration",
      type: "relationship",
      relationTo: "event-registrations",
      admin: {
        description: "Linked registration (if converted)",
        position: "sidebar",
      },
    },
  ],
  timestamps: true,
};
