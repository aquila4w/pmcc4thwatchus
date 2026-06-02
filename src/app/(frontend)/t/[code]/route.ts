import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const payload = await getPayload({ config });
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        inviteCode: { equals: code.toUpperCase() },
      },
      limit: 1,
      depth: 0,
    });

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || "https://pmcc4thwatch.us");

    if (registrations.docs.length === 0) {
      return NextResponse.redirect(new URL("/", baseUrl));
    }

    const registration = registrations.docs[0];
    const ticketUrl = `${baseUrl}/ticket/${registration.inviteCode}`;
    return NextResponse.redirect(ticketUrl);
  } catch (error) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || "https://pmcc4thwatch.us");
    return NextResponse.redirect(new URL("/", baseUrl));
  }
}
