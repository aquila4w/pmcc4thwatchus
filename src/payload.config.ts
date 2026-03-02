import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Collections
import { Users } from "./collections/Users";
import { Churches } from "./collections/Churches";
import { SubDistricts } from "./collections/SubDistricts";
import { NewsEvents } from "./collections/NewsEvents";
import { ManagedEvents } from "./collections/ManagedEvents";
import { EventRegistrations } from "./collections/EventRegistrations";
import { Campaigns } from "./collections/Campaigns";
import { Posts } from "./collections/Posts";
import { Pages } from "./collections/Pages";
import { Media } from "./collections/Media";
import { Categories } from "./collections/Categories";
import { Tags } from "./collections/Tags";
import { Widgets } from "./collections/Widgets";
import { PuckPages } from "./collections/PuckPages";

// Globals
import { Header } from "./globals/Header";
import { Footer } from "./globals/Footer";
import { ThemeSettings } from "./globals/ThemeSettings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: " - PMCC 4th Watch Admin",
      description: "PMCC 4th Watch US District Admin Dashboard",
      icons: [
        {
          rel: "icon",
          type: "image/svg+xml",
          url: "/cms/static/pmcc-icon.svg",
        },
      ],
    },
    components: {
      graphics: {
        Logo: "/app/(payload)/admin/components/Logo#Logo",
        Icon: "/app/(payload)/admin/components/Icon#Icon",
      },
      beforeDashboard: ["/app/(payload)/admin/components/Dashboard#Dashboard"],
    },
  },
  routes: {
    admin: "/cms",
    api: "/payload-api",
  },
  collections: [
    Users,
    Churches,
    SubDistricts,
    // Public Content
    NewsEvents,
    Posts,
    Pages,
    PuckPages,
    Media,
    Categories,
    Tags,
    Widgets,
    // Event Management (Admin Only)
    ManagedEvents,
    EventRegistrations,
    Campaigns,
  ],
  globals: [Header, Footer, ThemeSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "change-me",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || process.env.DATABASE_URI || "",
  }),
  sharp,
});
