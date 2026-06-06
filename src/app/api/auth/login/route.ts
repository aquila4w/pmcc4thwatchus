import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Rate limit by IP: 20 requests per 15 minutes
  const clientIp = getClientIp(request);
  const ipRateLimit = await rateLimitAsync(clientIp, { windowMs: 15 * 60 * 1000, maxRequests: 20 });
  if (!ipRateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(ipRateLimit.resetIn / 1000)) },
      }
    );
  }

  try {
    const payload = await getPayload({ config });
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Rate limit by email: 5 attempts per 15 minutes
    const emailRateLimit = await rateLimitAsync(`login:${email.toLowerCase()}`, { windowMs: 15 * 60 * 1000, maxRequests: 5 });
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts for this account" },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(emailRateLimit.resetIn / 1000)) },
        }
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
        forcePasswordChange: (result.user as Record<string, unknown>).forcePasswordChange as boolean || false,
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
    console.error("Login error");

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
