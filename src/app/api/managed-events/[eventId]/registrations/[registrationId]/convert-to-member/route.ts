import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { randomInt, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const TEMP_PASSWORD = process.env.GUEST_TEMP_PASSWORD;

const generateInviteCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let readable = "";
  for (let i = 0; i < 6; i++) {
    readable += chars[randomInt(chars.length)];
  }
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `${readable}-${suffix}`;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; registrationId: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const authUser = await getCurrentUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { registrationId } = await params;
    const { churchId } = await request.json();

    if (!churchId) {
      return NextResponse.json({ error: "Church ID is required" }, { status: 400 });
    }

    // 1. Find the registration
    const registration = await payload.findByID({
      collection: "event-registrations",
      id: registrationId,
      depth: 1,
    });

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // 2. Get the guest user ID
    const guestId = typeof registration.guest === "string"
      ? registration.guest
      : (registration.guest as { id?: string })?.id;

    if (!guestId) {
      return NextResponse.json({ error: "No guest user associated with this registration" }, { status: 400 });
    }

    // 3. Verify the guest user
    const guest = await payload.findByID({
      collection: "users",
      id: guestId,
      depth: 0,
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest user not found" }, { status: 404 });
    }

    // 4. Verify the church exists and get subDistrict
    const church = await payload.findByID({
      collection: "churches",
      id: churchId,
      depth: 1,
    });

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    // 5. Convert via raw MongoDB to avoid payload.update() stack overflow
    const inviteCode = generateInviteCode();
    if (!TEMP_PASSWORD) {
      return NextResponse.json({ error: "GUEST_TEMP_PASSWORD env var is required" }, { status: 500 });
    }
    const hashedPassword = await bcrypt.hash(TEMP_PASSWORD, 10);

    const userCollection = payload.db.collections["users"];
    const subDistrict = typeof church.subDistrict === "string"
      ? church.subDistrict
      : (church.subDistrict as { id?: string })?.id || undefined;

    await userCollection.updateOne(
      { _id: guestId },
      {
        $set: {
          role: "member",
          status: "approved",
          church: churchId,
          subDistrict,
          inviteCode,
          forcePasswordChange: true,
          promotedFromGuestAt: new Date().toISOString(),
          promotedFromGuestBy: String(authUser.id),
          password: hashedPassword,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Guest converted to member successfully",
      user: {
        id: guestId,
        name: guest.name,
        email: guest.email,
        role: "member",
        inviteCode,
        church: churchId,
      },
    });
  } catch (error) {
    console.error("Convert to member error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
