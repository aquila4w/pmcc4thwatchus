import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });

    // Try Payload token first (credentials login)
    const token = request.cookies.get("payload-token")?.value;
    let user = null;

    if (token) {
      const headersList = await headers();
      const authResult = await payload.auth({ headers: headersList });
      user = authResult.user;
    }

    // If no Payload token, try NextAuth session (OAuth login)
    if (!user) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        user = await payload.findByID({
          collection: "users",
          id: session.user.id,
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get church info
    let churchName = null;
    if (user.church) {
      try {
        const church = await payload.findByID({
          collection: "churches",
          id: user.church as string,
        });
        churchName = church?.name;
      } catch {
        // Continue without church name
      }
    }

    // Get invite statistics
    const inviteStats = await getInviteStats(payload, String(user.id));

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        inviteCode: user.inviteCode,
        church: churchName,
      },
      stats: inviteStats,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}

async function getInviteStats(payload: Awaited<ReturnType<typeof getPayload>>, userId: string) {
  try {
    // Get all registrations invited by this user
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        invitedBy: { equals: userId },
      },
      limit: 1000,
    });

    const total = registrations.totalDocs;
    const docs = registrations.docs as unknown as Array<{ status: string }>;
    const registered = docs.filter(
      (r) => r.status === "registered" || r.status === "attended" || r.status === "baptized"
    ).length;
    const attended = docs.filter(
      (r) => r.status === "attended" || r.status === "baptized"
    ).length;
    const baptized = docs.filter(
      (r) => r.status === "baptized"
    ).length;

    return {
      totalInvites: total,
      registered,
      attended,
      baptized,
    };
  } catch {
    return {
      totalInvites: 0,
      registered: 0,
      attended: 0,
      baptized: 0,
    };
  }
}
