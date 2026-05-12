import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";

// GET - List all baptized guests eligible for promotion
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });

    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const church = searchParams.get("church");
    const subDistrict = searchParams.get("subDistrict");

    // Find all guest users
    const guests = await payload.find({
      collection: "users",
      where: {
        role: { equals: "guest" },
      },
      sort: "name",
      limit: 999,
      depth: 1,
    });

    // Filter guests who have been baptized
    const eligibleGuests = await Promise.all(
      guests.docs.map(async (guest) => {
        // Find the most recent baptism registration
        const baptizedRegs = await payload.find({
          collection: "event-registrations",
          where: {
            and: [
              { guest: { equals: guest.id } },
              { status: { equals: "baptized" } },
            ],
          },
          sort: "-baptizedAt",
          limit: 1,
          depth: 1,
        });

        if (baptizedRegs.totalDocs === 0) {
          return null;
        }

        const baptismReg = baptizedRegs.docs[0];
        const event = baptismReg.event as { id?: string; title?: string } | null;

        // Filter by church if specified
        const guestChurch = guest.church as { id?: string; name?: string } | null;
        if (church && (!guestChurch || guestChurch.id !== church)) {
          return null;
        }

        // Filter by subdistrict if specified
        const guestSubDistrict = guest.subDistrict as { id?: string; name?: string } | null;
        if (subDistrict && (!guestSubDistrict || guestSubDistrict.id !== subDistrict)) {
          return null;
        }

        return {
          id: guest.id,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          church: guestChurch,
          subDistrict: guestSubDistrict,
          baptizedAt: baptismReg.baptizedAt,
          baptizedEvent: event?.title,
          registrationId: baptismReg.id,
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
