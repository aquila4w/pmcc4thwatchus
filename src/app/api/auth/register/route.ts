import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit by IP: 3 requests per hour
  const clientIp = getClientIp(request);
  const { allowed, resetIn } = rateLimit(clientIp, { windowMs: 60 * 60 * 1000, maxRequests: 3 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      }
    );
  }

  try {
    const payload = await getPayload({ config });
    const { name, email, password, phone, church } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter" },
        { status: 400 }
      );
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one lowercase letter" },
        { status: 400 }
      );
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one number" },
        { status: 400 }
      );
    }
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?\/]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one special character" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUsers = await payload.find({
      collection: "users",
      where: {
        email: { equals: email.toLowerCase() },
      },
      limit: 1,
    });

    if (existingUsers.docs.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Resolve sub-district from church if provided
    let subDistrict: string | undefined;
    if (church) {
      const churchDoc = await payload.findByID({
        collection: "churches",
        id: church,
      });
      if (churchDoc?.subDistrict) {
        subDistrict = typeof churchDoc.subDistrict === "object"
          ? churchDoc.subDistrict.id
          : churchDoc.subDistrict;
      }
    }

    // Create the user
    const user = await payload.create({
      collection: "users",
      data: {
        name,
        email: email.toLowerCase(),
        password,
        phone: phone || undefined,
        role: "member",
        status: "pending", // New registrations start as pending
        authProvider: "credentials",
        church: church || undefined,
        subDistrict,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful! Your account is pending approval.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle Payload validation errors
    const payloadError = error as { data?: { errors?: Array<{ message: string }> } };
    if (payloadError.data?.errors) {
      const messages = payloadError.data.errors.map((e) => e.message).join(", ");
      return NextResponse.json(
        { error: messages || "Registration failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
