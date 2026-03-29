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

    if (registrations.docs.length === 0) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const registration = registrations.docs[0];
    const ticketUrl = `${new URL(request.url).origin}/ticket/${registration.inviteCode}`;
    return NextResponse.redirect(ticketUrl);
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
