import { NextResponse } from "next/server";
import { getPayload } from "payload";
import { headers } from "next/headers";
import config from "@payload-config";

async function getCurrentUser() {
  const payload = await getPayload({ config });
  const headersList = await headers();
  const { user } = await payload.auth({ headers: headersList });
  return user;
}

const SEED_PLATFORMS = [
  {
    name: "Meta",
    slug: "meta",
    iconIdentifier: "meta",
    description: "Facebook and Instagram — share event links on Meta platforms",
    urlTemplate: "https://facebook.com/{handle}",
    color: "#1877F2",
    status: "active",
  },
  {
    name: "TikTok",
    slug: "tiktok",
    iconIdentifier: "tiktok",
    description: "TikTok — share event links via TikTok videos and bio",
    urlTemplate: "https://tiktok.com/@{handle}",
    color: "#000000",
    status: "active",
  },
  {
    name: "YouTube",
    slug: "youtube",
    iconIdentifier: "youtube",
    description: "YouTube — promote events via YouTube videos and descriptions",
    urlTemplate: "https://youtube.com/@{handle}",
    color: "#FF0000",
    status: "active",
  },
  {
    name: "Google",
    slug: "google",
    iconIdentifier: "google",
    description: "Google — search ads, Google Business, and organic search tracking",
    urlTemplate: "https://google.com/search?q={query}",
    color: "#4285F4",
    status: "active",
  },
  {
    name: "Eventbrite",
    slug: "eventbrite",
    iconIdentifier: "eventbrite",
    description: "Eventbrite — cross-post events and track referrals",
    urlTemplate: "https://eventbrite.com/{handle}",
    color: "#F05537",
    status: "active",
  },
];

export async function POST() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["superAdmin", "districtCoordinator", "eventAdmin"].includes(currentUser.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });
    let created = 0;
    let skipped = 0;

    for (const platform of SEED_PLATFORMS) {
      const existing = await payload.find({
        collection: "online-platforms",
        where: { slug: { equals: platform.slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });

      if (existing.totalDocs > 0) {
        skipped++;
        continue;
      }

      await payload.create({
        collection: "online-platforms",
        data: platform,
        depth: 0,
        overrideAccess: true,
      });
      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: SEED_PLATFORMS.length,
    });
  } catch (error) {
    console.error("Failed to seed online platforms:", error);
    return NextResponse.json({ error: "Failed to seed platforms" }, { status: 500 });
  }
}
