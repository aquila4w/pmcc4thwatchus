import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Where } from "payload";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";

// GET - List all managed events with filters (public)
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "999");
    const sort = searchParams.get("sort") || "-startDate";
    const page = parseInt(searchParams.get("page") || "1");
    const depth = parseInt(searchParams.get("depth") || "1");

    // Build where clause
    const where: Where = {};

    if (status) {
      where.status = { equals: status };
    }

    if (search) {
      where.or = [
        { title: { like: search } },
        { location: { like: search } },
        { description: { like: search } },
      ];
    }

    const result = await payload.find({
      collection: "managed-events",
      where,
      sort,
      limit,
      page,
      depth,
    });

    // Strip sensitive fields from public listing
    const safeDocs = result.docs.map(({ adminNotes, ...rest }: Record<string, unknown>) => rest);

    return NextResponse.json({
      docs: safeDocs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error("Managed events list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch managed events" },
      { status: 500 }
    );
  }
}

// POST - Create a new managed event (admin only)
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });

    // Auth check
    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isAdmin(authUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();

    // Only allow expected fields (prevent mass assignment)
    const {
      title,
      slug,
      description,
      location,
      address,
      startDate,
      endDate,
      timezone,
      status,
      maxAttendees,
      registrationEnabled,
      registrationDeadline,
      requireApproval,
      checkInEnabled,
      hasBaptism,
      heroImage,
      landingPageHeroImage,
      landingPageTitle,
      landingPageContent,
      landingPageShowQR,
      landingPageShowInviter,
      landingPageCTA,
      landingPageCTALink,
      thankYouTitle,
      thankYouMessage,
      showQRCode,
      sendConfirmationEmail,
      allowMultipleCheckIns,
      checkInStartTime,
      organizer,
      eventType,
      contactName,
      contactPhone,
      contactEmail,
      contactWebsite,
    } = body;

    const data: Record<string, unknown> = {
      title,
      slug,
      description,
      location,
      address,
      startDate,
      endDate,
      timezone,
      status,
      maxAttendees,
      registrationEnabled,
      registrationDeadline,
      requireApproval,
      checkInEnabled,
      hasBaptism,
      heroImage,
      landingPageHeroImage,
      landingPageTitle,
      landingPageContent,
      landingPageShowQR,
      landingPageShowInviter,
      landingPageCTA,
      landingPageCTALink,
      thankYouTitle,
      thankYouMessage,
      showQRCode,
      sendConfirmationEmail,
      allowMultipleCheckIns,
      checkInStartTime,
      organizer,
      eventType,
      contactName,
      contactPhone,
      contactEmail,
      contactWebsite,
    };

    // Auto-generate slug from title if not provided
    if (title) {
      data.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const result = await payload.create({
      collection: "managed-events",
      data,
      depth: 1,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Managed event creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
