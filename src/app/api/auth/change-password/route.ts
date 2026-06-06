import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const authUser = await getCurrentUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Update password and clear forcePasswordChange flag via raw MongoDB
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const userCollection = payload.db.collections["users"];
    await userCollection.updateOne(
      { _id: String(authUser.id) },
      {
        $set: {
          password: hashedPassword,
          forcePasswordChange: false,
        },
      }
    );

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
