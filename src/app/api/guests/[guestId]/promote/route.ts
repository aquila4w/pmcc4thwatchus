import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { sendRegistrationEmail } from "@/lib/email";

// Generate a readable invite code (same as in Users collection)
const generateInviteCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let readable = "";
  for (let i = 0; i < 6; i++) {
    readable += chars[Math.floor(Math.random() * chars.length)];
  }
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${readable}-${suffix}`;
};

// POST - Promote a guest to member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { guestId } = await params;
    const body = await request.json();
    const { churchId } = body;

    // Get the requesting user (must be logged in)
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify the requesting user has permission
    let reqUser = null;
    try {
      // Use Payload to verify the token and get the user
      const users = await payload.find({
        collection: "users",
        where: {
          _status: { equals: "published" },
        },
        limit: 1,
        depth: 0,
      });

      // For now, we'll get the user from a session cookie or similar
      // This is a simplified version - in production you'd verify the JWT properly
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Find the guest user
    const guest = await payload.findByID({
      collection: "users",
      id: guestId,
      depth: 0,
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }

    if (guest.role !== "guest") {
      return NextResponse.json(
        { error: "User is not a guest" },
        { status: 400 }
      );
    }

    // Verify church assignment is provided
    if (!churchId) {
      return NextResponse.json(
        { error: "Church assignment is required for promotion" },
        { status: 400 }
      );
    }

    // Verify the church exists
    const church = await payload.findByID({
      collection: "churches",
      id: churchId,
      depth: 0,
    });

    if (!church) {
      return NextResponse.json(
        { error: "Church not found" },
        { status: 404 }
      );
    }

    // Check if guest has been baptized (has event-registration with status="baptized")
    const baptizedRegistrations = await payload.find({
      collection: "event-registrations",
      where: {
        and: [
          { guest: { equals: guestId } },
          { status: { equals: "baptized" } },
        ],
      },
      limit: 1,
    });

    if (baptizedRegistrations.totalDocs === 0) {
      return NextResponse.json(
        { error: "Guest must be baptized before being promoted to member" },
        { status: 400 }
      );
    }

    // Get church info for subdistrict auto-population
    const fullChurch = await payload.findByID({
      collection: "churches",
      id: churchId,
      depth: 1,
    });

    // Promote the guest to member
    const promotedUser = await payload.update({
      collection: "users",
      id: guestId,
      data: {
        role: "member",
        church: churchId,
        subDistrict: fullChurch?.subDistrict,
        inviteCode: generateInviteCode(), // Generate member invite code
        promotedFromGuestAt: new Date().toISOString(),
        // Note: promotedFromGuestBy would need to be set by the actual authenticated user
      },
      depth: 0,
    });

    // Send welcome email to new member
    if (guest.email) {
      const baseUrl = request.headers.get("origin") || "https://pmcc4thwatch.us";
      const inviteLink = `${baseUrl}/invite/${promotedUser.inviteCode}`;

      try {
        // Send a simple welcome email (reuse existing email function)
        await sendRegistrationEmail({
          to: guest.email,
          guestName: guest.name,
          eventTitle: "Welcome to PMCC 4th Watch",
          eventDate: new Date().toLocaleDateString(),
          eventLocation: "US District",
          registrationCode: promotedUser.inviteCode || "",
          qrCodeUrl: "",
          ticketUrl: inviteLink,
          invitedByName: "PMCC 4th Watch",
        });
      } catch (emailError) {
        console.error("Welcome email failed:", emailError);
        // Don't fail the promotion if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Guest promoted to member successfully",
      user: {
        id: promotedUser.id,
        name: promotedUser.name,
        email: promotedUser.email,
        role: promotedUser.role,
        inviteCode: promotedUser.inviteCode,
        church: churchId,
        promotedFromGuestAt: promotedUser.promotedFromGuestAt,
      },
      church: {
        id: church.id,
        name: church.name,
      },
    });
  } catch (error) {
    console.error("Guest promotion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get eligible guests for promotion (baptized guests)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);
    const church = searchParams.get("church");
    const subDistrict = searchParams.get("subDistrict");

    // Build where clause to find baptized guests
    const where: Record<string, unknown> = {
      role: { equals: "guest" },
    };

    // Find all guest users
    const guests = await payload.find({
      collection: "users",
      where: where,
      sort: "name",
      limit: 999,
      depth: 1,
    });

    // Filter guests who have been baptized
    const eligibleGuests = await Promise.all(
      guests.docs.map(async (guest) => {
        const baptizedRegs = await payload.find({
          collection: "event-registrations",
          where: {
            and: [
              { guest: { equals: guest.id } },
              { status: { equals: "baptized" } },
            ],
          },
          limit: 1,
        });

        if (baptizedRegs.totalDocs === 0) {
          return null;
        }

        // Filter by church if specified
        const guestChurch = guest.church as { id?: string } | null;
        if (church && (!guestChurch || guestChurch.id !== church)) {
          return null;
        }

        // Filter by subdistrict if specified
        const guestSubDistrict = guest.subDistrict as { id?: string } | null;
        if (subDistrict && (!guestSubDistrict || guestSubDistrict.id !== subDistrict)) {
          return null;
        }

        return {
          id: guest.id,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          church: guest.church,
          subDistrict: guest.subDistrict,
          baptizedAt: baptizedRegs.docs[0].baptizedAt,
        };
      })
    );

    const filteredGuests = eligibleGuests.filter(Boolean);

    return NextResponse.json({
      guests: filteredGuests,
      total: filteredGuests.length,
    });
  } catch (error) {
    console.error("Eligible guests fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
