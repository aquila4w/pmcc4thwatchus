import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";

const SITE_URL = "https://pmcc4thwatch.us";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const pageUrl = `${SITE_URL}/ticket/${code}`;
  try {
    const payload = await getPayload({ config });
    const registrations = await payload.find({
      collection: "event-registrations",
      where: { inviteCode: { equals: code.toUpperCase() } },
      limit: 1,
      depth: 1,
    });
    const registration = registrations.docs[0];
    const event = registration?.event as { title?: string } | undefined;
    const eventTitle = event?.title;
    if (eventTitle) {
      const title = `Ticket - ${eventTitle}`;
      const fullTitle = `${title} - PMCC 4th Watch | US District`;
      return {
        title,
        description: fullTitle,
        alternates: { canonical: pageUrl },
        openGraph: { title: fullTitle, description: fullTitle, url: pageUrl },
        twitter: { title: fullTitle, description: fullTitle },
      };
    }
  } catch {}
  const fullTitle = "Your Ticket - PMCC 4th Watch | US District";
  return {
    title: "Your Ticket",
    description: fullTitle,
    alternates: { canonical: pageUrl },
    openGraph: { title: fullTitle, description: fullTitle, url: pageUrl },
    twitter: { title: fullTitle, description: fullTitle },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
