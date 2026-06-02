import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // Use Host header (preserves original domain behind proxies) over request.url
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || "https://pmcc4thwatch.us");

  try {
    const { code } = await params;
    const payload = await getPayload({ config });

    // Look up the platform event link by code
    const links = await payload.find({
      collection: "platform-event-links",
      where: {
        and: [
          { code: { equals: code.toUpperCase() } },
          { status: { equals: "active" } },
        ],
      },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    });

    if (links.totalDocs === 0) {
      return NextResponse.redirect(new URL("/", baseUrl));
    }

    const link = links.docs[0];

    // Resolve event slug
    const event = typeof link.event === "object" ? link.event : await payload.findByID({
      collection: "managed-events",
      id: String(link.event),
      depth: 0,
      overrideAccess: true,
    });

    if (!event?.slug) {
      return NextResponse.redirect(new URL("/", baseUrl));
    }

    // Resolve platform slug for UTM
    const platform = typeof link.platform === "object" ? link.platform : await payload.findByID({
      collection: "online-platforms",
      id: String(link.platform),
      depth: 0,
      overrideAccess: true,
    });

    const platformSlug = platform?.slug || "unknown";

    // Increment scan count (fire and forget)
    payload.update({
      collection: "platform-event-links",
      id: link.id,
      data: { scanCount: (link.scanCount || 0) + 1 },
      depth: 0,
      overrideAccess: true,
    }).catch(() => {});

    // Create invite scan record (fire and forget)
    try {
      const headers = request.headers;
      const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || headers.get("x-real-ip")
        || "unknown";

      payload.create({
        collection: "invite-scans",
        data: {
          inviteType: "platform",
          inviteCode: code.toUpperCase(),
          platformEventLink: link.id,
          event: event.id,
          ipAddress: ip,
          userAgent: headers.get("user-agent") || "",
          referrer: headers.get("referer") || "",
          utmSource: platformSlug,
          utmMedium: "qr",
          utmCampaign: `event-${event.slug}`,
          pageUrl: request.url,
          scannedAt: new Date().toISOString(),
          registered: false,
        },
        depth: 0,
        overrideAccess: true,
      }).catch(() => {});
    } catch {
      // Non-critical
    }

    // If custom URL is set, redirect there (validate to prevent open redirect)
    if (link.customUrl) {
      try {
        const parsed = new URL(link.customUrl);
        if (!["https:", "http:"].includes(parsed.protocol)) {
          // Reject non-HTTP schemes (javascript:, data:, etc.)
          return NextResponse.redirect(new URL("/", baseUrl));
        }
      } catch {
        return NextResponse.redirect(new URL("/", baseUrl));
      }
      return NextResponse.redirect(link.customUrl);
    }

    // Build registration URL with UTM params and platform code
    const regUrl = new URL(`/register/${event.slug}`, baseUrl);
    regUrl.searchParams.set("platform", code.toUpperCase());
    regUrl.searchParams.set("utm_source", platformSlug);
    regUrl.searchParams.set("utm_medium", "qr");
    regUrl.searchParams.set("utm_campaign", `event-${event.slug}`);

    return NextResponse.redirect(regUrl.toString());
  } catch (error) {
    console.error("Platform redirect error:", error);
    return NextResponse.redirect(new URL("/", baseUrl));
  }
}
