import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { eventId } = await params;

    // Authenticate — same pattern as /api/auth/me
    const token = request.cookies.get("payload-token")?.value;
    let user: { id: string } | null = null;

    if (token) {
      const headersList = await headers();
      const authResult = await payload.auth({ headers: headersList });
      user = authResult.user as { id: string } | null;
    }

    if (!user) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        user = { id: session.user.id };
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch the user's invite for this specific event
    const invites = await payload.find({
      collection: "event-invites",
      where: {
        and: [
          { event: { equals: eventId } },
          { invitedBy: { equals: user.id } },
        ],
      },
      depth: 0,
      limit: 1,
    });

    if (invites.docs.length === 0) {
      return NextResponse.json({ invite: null });
    }

    const invite = invites.docs[0];
    const inviteCode = invite.inviteCode as string;

    // Get the event slug to build the full link
    const event = await payload.findByID({
      collection: "managed-events",
      id: eventId,
      depth: 0,
      select: { slug: true },
    });

    const slug = (event as { slug?: string })?.slug || "";
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
    const inviteLink = slug
      ? `${baseUrl}/register/${slug}?invite=${inviteCode}`
      : `${baseUrl}/register?invite=${inviteCode}`;

    return NextResponse.json({
      invite: {
        inviteCode,
        inviteLink,
        registrationCount: invite.registrationCount || 0,
        status: invite.status,
      },
    });
  } catch (error) {
    console.error("my-invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
