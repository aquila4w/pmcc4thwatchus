import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/register/"],
    },
    sitemap: "https://pmcc4thwatch.us/sitemap.xml",
  };
}
