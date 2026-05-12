import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomInt } from "crypto";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateShortCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CHARS[randomInt(CHARS.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });

    // Authenticate — superAdmin only
    const token = request.cookies.get("payload-token")?.value;
    let user: { id: string; role: string } | null = null;

    if (token) {
      const headersList = await headers();
      const authResult = await payload.auth({ headers: headersList });
      user = authResult.user as { id: string; role: string } | null;
    }

    if (!user) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        user = await payload.findByID({ collection: "users", id: session.user.id, depth: 0 }) as { id: string; role: string };
      }
    }

    if (!user || !["superAdmin", "districtCoordinator"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Find all invites with UUID-format codes (contain dashes, length 36)
    const invites = await payload.find({
      collection: "event-invites",
      where: {
        inviteCode: { contains: "-" },
      },
      limit: 9999,
      depth: 0,
      overrideAccess: true,
    });

    if (invites.docs.length === 0) {
      return NextResponse.json({ migrated: 0, message: "No UUID-format codes found" });
    }

    let migrated = 0;
    for (const invite of invites.docs) {
      let newCode = generateShortCode();
      // Ensure uniqueness with retry
      for (let attempt = 0; attempt < 10; attempt++) {
        const existing = await payload.find({
          collection: "event-invites",
          where: { inviteCode: { equals: newCode } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        });
        if (existing.totalDocs === 0) break;
        newCode = generateShortCode();
      }

      await payload.update({
        collection: "event-invites",
        id: invite.id,
        data: { inviteCode: newCode },
        overrideAccess: true,
      });
      migrated++;

      // Small delay to avoid overwhelming MongoDB
      if (migrated % 10 === 0) await new Promise((r) => setTimeout(r, 50));
    }

    return NextResponse.json({
      migrated,
      total: invites.totalDocs,
      message: `Migrated ${migrated} invite codes from UUID to short format`,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
