import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

// Short invite link: /i/{inviteCode} → /register/{eventSlug}?invite={inviteCode}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || "https://pmcc4thwatch.us");

  try {
    const { code } = await params;
    const payload = await getPayload({ config });

    // Look up the event invite by code
    const invites = await payload.find({
      collection: "event-invites",
      where: {
        and: [
          { inviteCode: { equals: code.toUpperCase() } },
          { status: { equals: "active" } },
        ],
      },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    });

    if (invites.totalDocs === 0) {
      return NextResponse.redirect(new URL("/", baseUrl));
    }

    const invite = invites.docs[0];

    // Resolve event slug
    const event = typeof invite.event === "object"
      ? invite.event
      : await payload.findByID({
          collection: "managed-events",
          id: String(invite.event),
          depth: 0,
          overrideAccess: true,
        });

    if (!event?.slug) {
      return NextResponse.redirect(new URL("/", baseUrl));
    }

    // Build registration URL with invite code
    const regUrl = new URL(`/register/${event.slug}`, baseUrl);
    regUrl.searchParams.set("invite", code.toUpperCase());

    return NextResponse.redirect(regUrl.toString());
  } catch (error) {
    console.error("Invite redirect error:", error);
    return NextResponse.redirect(new URL("/", baseUrl));
  }
}
