import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
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
      return { title: `Ticket - ${eventTitle}` };
    }
  } catch {}
  return { title: "Your Ticket" };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
