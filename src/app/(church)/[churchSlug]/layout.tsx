import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import "../../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ churchSlug: string }>;
}): Promise<Metadata> {
  const { churchSlug } = await params;
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
      return {
        title: {
          default: `${church.name} - PMCC 4th Watch`,
          template: `%s | ${church.name} - PMCC 4th Watch`,
        },
      };
    }
  } catch {}
  return { title: "Church - PMCC 4th Watch" };
}

export default function ChurchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
