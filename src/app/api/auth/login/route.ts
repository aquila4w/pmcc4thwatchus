import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate with Payload
    const result = await payload.login({
      collection: "users",
      data: {
        email,
        password,
      },
    });

    if (!result.token || !result.user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Get church info if available
    let churchName = null;
    if (result.user.church) {
      try {
        const church = await payload.findByID({
          collection: "churches",
          id: result.user.church as string,
        });
        churchName = church?.name;
      } catch {
        // Church lookup failed, continue without it
      }
    }

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        phone: result.user.phone,
        role: result.user.role,
        inviteCode: result.user.inviteCode,
        church: churchName,
      },
    });

    // Set HTTP-only cookie for token
    response.cookies.set("payload-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("credentials")) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
