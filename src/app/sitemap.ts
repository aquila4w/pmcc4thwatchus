import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://pmcc4thwatch.us";

  // Static pages
  const staticPages = [
    "",
    "/about",
    "/about/beliefs",
    "/about/mission",
    "/about/history",
    "/about/leaders",
    "/events",
    "/locate",
    "/new-here",
    "/give",
    "/contact",
    "/hfgc",
    "/gallery",
    "/radio",
    "/sermons",
    "/publications",
    "/ministries",
  ];

  const sitemap: MetadataRoute.Sitemap = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/about") ? 0.8 : 0.7,
  }));

  return sitemap;
}
