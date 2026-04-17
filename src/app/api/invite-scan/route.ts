import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { parseUserAgent } from "@/lib/user-agent";
import { lookupIp } from "@/lib/geoip";

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const body = await request.json();
    const { inviteType, inviteCode, event, churchEventInvite, eventInvite } = body;

    if (!inviteType || !inviteCode || !event) {
      return NextResponse.json(
        { error: "Missing required fields: inviteType, inviteCode, event" },
        { status: 400 }
      );
    }

    // Parse user-agent
    const ua = request.headers.get("user-agent") || "";
    const { device, os, browser } = parseUserAgent(ua);

    // Capture IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";

    // Look up geolocation from IP
    const geo = ip !== "unknown" ? await lookupIp(ip).catch(() => null) : null;

    // Server-side metadata
    const referrerHeader = request.headers.get("referer") || body.referrer || "";
    const language = request.headers.get("accept-language") || body.language || "";

    // Look up church/adPlacement for denormalization
    let church: string | undefined;
    let adPlacement: string | undefined;

    if (inviteType === "church" && churchEventInvite) {
      try {
        const ci = await payload.findByID({
          collection: "church-event-invites",
          id: churchEventInvite,
          depth: 0,
          overrideAccess: true,
        });
        church = ci?.church as string | undefined;
        adPlacement = ci?.adPlacement as string | undefined;
      } catch {
        // Church invite not found, continue without denormalized fields
      }
    } else if (inviteType === "member" && eventInvite) {
      try {
        const ei = await payload.findByID({
          collection: "event-invites",
          id: eventInvite,
          depth: 0,
          overrideAccess: true,
        });
        church = ei?.church as string | undefined;
      } catch {
        // Event invite not found
      }
    }

    // Create scan record
    const scan = await payload.create({
      collection: "invite-scans",
      data: {
        inviteType,
        inviteCode,
        eventInvite: eventInvite || undefined,
        churchEventInvite: churchEventInvite || undefined,
        event,
        church: church || undefined,
        adPlacement: adPlacement || undefined,
        ipAddress: ip,
        city: geo?.city || undefined,
        region: geo?.region || undefined,
        country: geo?.country || undefined,
        userAgent: ua,
        device,
        os,
        browser,
        // Attribution
        referrer: referrerHeader || undefined,
        utmSource: body.utmSource || undefined,
        utmMedium: body.utmMedium || undefined,
        utmCampaign: body.utmCampaign || undefined,
        utmContent: body.utmContent || undefined,
        utmTerm: body.utmTerm || undefined,
        pageUrl: body.pageUrl || undefined,
        // Display & locale
        language: language || undefined,
        timezone: body.timezone || undefined,
        screenWidth: body.screenWidth || undefined,
        screenHeight: body.screenHeight || undefined,
        colorDepth: body.colorDepth || undefined,
        pixelRatio: body.pixelRatio || undefined,
        // Hardware fingerprint
        gpuVendor: body.gpuVendor || undefined,
        gpuRenderer: body.gpuRenderer || undefined,
        cpuCores: body.cpuCores || undefined,
        deviceMemory: body.deviceMemory || undefined,
        touchSupport: body.touchSupport || undefined,
        canvasHash: body.canvasHash || undefined,
        audioHash: body.audioHash || undefined,
        // Network
        connectionType: body.connectionType || undefined,
        connectionDownlink: body.connectionDownlink || undefined,
        connectionRtt: body.connectionRtt || undefined,
        // Browser environment
        doNotTrack: body.doNotTrack || undefined,
        cookiesEnabled: body.cookiesEnabled || undefined,
        adBlockerDetected: body.adBlockerDetected || undefined,
        localStorageAvailable: body.localStorageAvailable || undefined,
        platform: body.platform || undefined,
        // Timing
        scannedAt: new Date().toISOString(),
        registered: false,
      },
      depth: 0,
      overrideAccess: true,
    });

    // Increment scanCount on the source invite
    try {
      if (inviteType === "church" && churchEventInvite) {
        const ci = await payload.findByID({
          collection: "church-event-invites",
          id: churchEventInvite,
          depth: 0,
          overrideAccess: true,
        });
        await payload.update({
          collection: "church-event-invites",
          id: churchEventInvite,
          data: { scanCount: (ci?.scanCount || 0) + 1 },
          depth: 0,
          overrideAccess: true,
        });
      } else if (inviteType === "member" && eventInvite) {
        // Could add scanCount to event-invites later if needed
      }
    } catch {
      // Non-critical — don't fail the scan if counter update fails
    }

    return NextResponse.json({ scanId: scan.id });
  } catch (error) {
    console.error("Invite scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: update scan record when registration completes
export async function PATCH(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const body = await request.json();
    const { scanId, registered, registrationId } = body;

    if (!scanId) {
      return NextResponse.json({ error: "Missing scanId" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (registered !== undefined) updateData.registered = registered;
    if (registrationId) updateData.registration = registrationId;
    if (registered) updateData.registeredAt = new Date().toISOString();
    // Behavioral data from registration page
    if (body.timeOnPage !== undefined) updateData.timeOnPage = body.timeOnPage;
    if (body.formStartDelay !== undefined) updateData.formStartDelay = body.formStartDelay;
    if (body.scrollDepth !== undefined) updateData.scrollDepth = body.scrollDepth;
    if (body.rageClickDetected !== undefined) updateData.rageClickDetected = body.rageClickDetected;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
    }

    await payload.update({
      collection: "invite-scans",
      id: scanId,
      data: updateData,
      depth: 0,
      overrideAccess: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invite scan update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
