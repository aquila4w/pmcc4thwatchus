import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/register/", "/ticket/", "/t/"],
    },
    sitemap: "https://pmcc4thwatch.us/sitemap.xml",
  };
}
