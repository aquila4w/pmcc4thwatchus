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
    const eventTitle = events.docs[0]?.title;
    if (eventTitle) {
      return {
        title: `Register - ${eventTitle}`,
        description: `Register to ${eventTitle}!`,
      };
    }
  } catch {}
  return { title: "Event Registration" };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
