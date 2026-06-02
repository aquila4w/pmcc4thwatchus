import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}): Promise<Metadata> {
  const { eventSlug } = await params;
  try {
    const payload = await getPayload({ config });
    const events = await payload.find({
      collection: "managed-events",
      where: { slug: { equals: eventSlug } },
      limit: 1,
    });
    const event = events.docs[0];
    if (event?.title) {
      const description = `Register to ${event.title}!`;
      const pageUrl = `https://pmcc4thwatch.us/register/${eventSlug}`;
      const ogImage = event.heroImage?.url
        ? { url: event.heroImage.url, width: 1200, height: 630, alt: event.title }
        : undefined;
      return {
        title: `Register - ${event.title}`,
        description,
        alternates: {
          canonical: pageUrl,
        },
        openGraph: {
          title: `Register - ${event.title}`,
          description,
          url: pageUrl,
          ...(ogImage && { images: [ogImage] }),
        },
        twitter: {
          title: `Register - ${event.title}`,
          description,
          ...(ogImage && { images: [ogImage.url as string] }),
        },
      };
    }
  } catch {}
  return { title: "Event Registration" };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
