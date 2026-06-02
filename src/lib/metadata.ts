import type { Metadata } from "next";

const SITE_URL = "https://pmcc4thwatch.us";
const SITE_NAME = "PMCC 4th Watch US District";
const TITLE_SUFFIX = "PMCC 4th Watch | US District";

/**
 * Generate page-level metadata with description matching the rendered <title>,
 * proper og:url, canonical, and Open Graph / Twitter overrides.
 *
 * @param title - Page title (without the suffix). e.g. "About" → rendered as "About - PMCC 4th Watch | US District"
 * @param path  - URL path segment. e.g. "/about" or "/sermons"
 */
export function generatePageMetadata(title: string, path: string): Metadata {
  const fullTitle = `${title} - ${TITLE_SUFFIX}`;
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description: fullTitle,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description: fullTitle,
      url,
    },
    twitter: {
      title: fullTitle,
      description: fullTitle,
    },
  };
}
