import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import "../../globals.css";

const SITE_URL = "https://pmcc4thwatch.us";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ churchSlug: string }>;
}): Promise<Metadata> {
  const { churchSlug } = await params;
  const pageUrl = `${SITE_URL}/${churchSlug}`;
  try {
    const payload = await getPayload({ config });
    const churches = await payload.find({
      collection: "churches",
      where: { slug: { equals: churchSlug } },
      limit: 1,
      depth: 0,
    });
    const church = churches.docs[0];
    if (church) {
      const fullTitle = `${church.name} - PMCC 4th Watch`;
      return {
        title: {
          default: fullTitle,
          template: `%s | ${fullTitle}`,
        },
        description: fullTitle,
        alternates: { canonical: pageUrl },
        openGraph: { title: fullTitle, description: fullTitle, url: pageUrl },
        twitter: { title: fullTitle, description: fullTitle },
      };
    }
  } catch {}
  const fullTitle = "Church - PMCC 4th Watch";
  return {
    title: fullTitle,
    description: fullTitle,
    alternates: { canonical: pageUrl },
    openGraph: { title: fullTitle, description: fullTitle, url: pageUrl },
    twitter: { title: fullTitle, description: fullTitle },
  };
}

export default function ChurchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
