import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { code } = await params;

    // Find the registration
    const registrations = await payload.find({
      collection: "event-registrations",
      where: {
        inviteCode: { equals: code.toUpperCase() },
      },
      limit: 1,
      depth: 2,
    });

    if (registrations.docs.length === 0) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    const registration = registrations.docs[0];
    const event = registration.event as {
      title?: string;
      startDate?: string;
      location?: string;
      address?: string;
    };
    const invitedBy = registration.invitedBy as { name?: string } | null;

    // Format date
    const eventDate = event?.startDate
      ? new Date(event.startDate).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "TBD";

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registration.inviteCode)}`;

    // Generate HTML for the ticket (will be converted to PDF by browser print)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Event Ticket - ${escapeHtml(registration.inviteCode)}</title>
  <style>
    @page { size: A5 landscape; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f3f4f6;
      padding: 20px;
    }
    .ticket {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      max-width: 700px;
      margin: 0 auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      display: flex;
    }
    .ticket-main {
      flex: 1;
      padding: 32px;
    }
    .ticket-qr {
      width: 220px;
      background: linear-gradient(135deg, #1e3a5f 0%, #2a4d7a 100%);
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      border-left: 2px dashed #e5e7eb;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
    }
    .logo-circle {
      width: 40px;
      height: 40px;
      border: 2px solid #c9a227;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Georgia, serif;
      font-weight: bold;
      color: #1e3a5f;
    }
    .logo-text {
      font-family: Georgia, serif;
      font-size: 18px;
      font-weight: 600;
      color: #1e3a5f;
    }
    .logo-sub {
      font-size: 9px;
      color: #6b7280;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .event-title {
      font-family: Georgia, serif;
      font-size: 24px;
      font-weight: 600;
      color: #1e3a5f;
      margin-bottom: 16px;
    }
    .detail {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 12px;
      color: #374151;
      font-size: 14px;
    }
    .detail-icon {
      width: 20px;
      color: #c9a227;
    }
    .guest-name {
      font-size: 18px;
      font-weight: 600;
      color: #1e3a5f;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    .invited-by {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .qr-box {
      background: white;
      padding: 12px;
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .qr-code {
      font-family: monospace;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 3px;
      margin-top: 8px;
    }
    .qr-label {
      font-size: 11px;
      opacity: 0.8;
      margin-top: 8px;
    }
    @media print {
      body { background: white; padding: 0; }
      .ticket { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-main">
      <div class="logo">
        <div class="logo-circle">P</div>
        <div>
          <div class="logo-text">PMCC 4th Watch</div>
          <div class="logo-sub">US District</div>
        </div>
      </div>

      <h1 class="event-title">${escapeHtml(event?.title) || "Event"}</h1>

      <div class="detail">
        <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <span>${eventDate}</span>
      </div>

      <div class="detail">
        <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <div>
          <div>${escapeHtml(event?.location) || "TBD"}</div>
          ${event?.address ? `<div style="font-size: 12px; color: #9ca3af;">${escapeHtml(event.address)}</div>` : ""}
        </div>
      </div>

      <div class="guest-name">${escapeHtml(registration.guestInfo?.name) || "Guest"}</div>
      ${invitedBy?.name ? `<div class="invited-by">Invited by ${escapeHtml(invitedBy.name)}</div>` : ""}
    </div>

    <div class="ticket-qr">
      <div class="qr-box">
        <img src="${qrCodeUrl}" alt="QR Code" width="176" height="176">
      </div>
      <div class="qr-code">${escapeHtml(registration.inviteCode)}</div>
      <div class="qr-label">Present at check-in</div>
    </div>
  </div>

  <script>
    // Auto-print when loaded
    window.onload = function() {
      // window.print();
    }
  </script>
</body>
</html>
    `.trim();

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="ticket-${registration.inviteCode}.html"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
