import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.preview.same-app.com"],
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/events",
        permanent: false,
        has: [
          {
            type: "cookie",
            key: "payload-token",
          },
        ],
      },
    ];
  },
  // Fix for S3 storage plugin - exclude AWS SDK from bundling
  serverExternalPackages: [
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "@aws-sdk/signature-v4-crt",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
      // Cloudflare R2 for media storage
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      // Production custom domain for media
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_MEDIA_URL || "images.pmcc4thwatch.us",
        pathname: "/**",
      },
    ],
  },
  compress: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "date-fns",
      "recharts",
      "@radix-ui/react-icons",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude AWS SDK from server-side bundling
      config.externals = [...(config.externals || []), "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"];
    }
    return config;
  },
};

export default withPayload(nextConfig);
