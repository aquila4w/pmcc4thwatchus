import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import { s3Storage } from "@payloadcms/storage-s3";
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
import { EventInvites } from "./collections/EventInvites";
import { Campaigns } from "./collections/Campaigns";
import { Posts } from "./collections/Posts";
import { Pages } from "./collections/Pages";
import { Media } from "./collections/Media";
import { Categories } from "./collections/Categories";
import { Tags } from "./collections/Tags";
import { Widgets } from "./collections/Widgets";
// import { PuckPages } from "./collections/PuckPages"; // REMOVED FOR TESTING

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
    // PuckPages, // REMOVED FOR TESTING
    Media,
    Categories,
    Tags,
    Widgets,
    // Event Management (Admin Only)
    ManagedEvents,
    EventRegistrations,
    EventInvites,
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
    connectOptions: {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
    },
  }),
  sharp,
  plugins: Array.from(
    [
      // S3 storage for media uploads (Cloudflare R2)
      // Fixed Jest worker error by adding AWS SDK to externals in next.config.mjs
      process.env.S3_ACCESS_KEY_ID
        ? s3Storage({
            bucket: process.env.S3_BUCKET || "pmcc4thwatch-media",
            config: {
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
              },
              region: process.env.S3_REGION || "us-east-1",
              ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }),
            },
            collections: {
              media: true, // Apply to Media collection
            },
          })
        : null,
    ].filter((p): p is Exclude<typeof p, null> => p !== null),
  ),
});
