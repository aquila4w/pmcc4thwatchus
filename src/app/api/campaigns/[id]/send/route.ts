import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { replacePlaceholders, getRecipients, formatCampaignEventDate, updateCampaignStatus, batchSend } from "@/lib/campaigns";
import { sendRegistrationEmail } from "@/lib/email";
import { sendRegistrationSMS } from "@/lib/sms";

// POST - Execute/send a campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { id: campaignId } = await params;

    // Get the campaign
    const campaign = await payload.findByID({
      collection: "campaigns",
      id: campaignId,
      depth: 2,
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const event = campaign.event as {
      id?: string;
      title?: string;
      startDate?: string;
      location?: string;
    } | null;

    if (!event?.id) {
      return NextResponse.json(
        { error: "Event not found for this campaign" },
        { status: 400 }
      );
    }

    // Update status to sending
    await updateCampaignStatus(payload, campaignId, "sending");

    // Get recipients based on target audience
    const recipients = await getRecipients(
      payload,
      event.id,
      campaign.targetAudience as "all" | "notAttended" | "attended" | "notBaptized"
    );

    if (recipients.length === 0) {
      await updateCampaignStatus(payload, campaignId, "sent", 0);
      return NextResponse.json({
        success: true,
        message: "No recipients found for this campaign",
        sentCount: 0,
      });
    }

    // Format event date/time
    const { date: eventDate, time: eventTime } = formatCampaignEventDate(event.startDate);

    // Generate QR link base URL
    const baseUrl = request.headers.get("origin") || "https://pmcc4thwatch.us";

    // Track sent count
    let sentCount = 0;
    const errors: Array<{ recipient: string; error: string }> = [];

    // Process each recipient
    for (const recipient of recipients) {
      const ticketUrl = `${baseUrl}/ticket/${recipient.inviteCode}`;
      const campaignData = {
        name: recipient.guestName,
        event: event.title,
        eventDate,
        eventTime,
        eventLocation: event.location || "TBD",
        qrLink: ticketUrl,
        inviteCode: recipient.inviteCode,
      };

      // Send email if campaign type includes email
      if (
        (campaign.type === "email" || campaign.type === "both") &&
        recipient.guestEmail
      ) {
        try {
          const emailContent = replacePlaceholders(
            campaign.emailContent || "",
            campaignData
          );

          // Send using Resend
          const subject = replacePlaceholders(
            campaign.subject || "",
            campaignData
          );

          await sendRegistrationEmail({
            to: recipient.guestEmail,
            guestName: recipient.guestName,
            eventTitle: event.title,
            eventDate: `${eventDate} at ${eventTime}`,
            eventLocation: event.location || "TBD",
            registrationCode: recipient.inviteCode,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(recipient.inviteCode)}`,
            ticketUrl: ticketUrl,
            invitedByName: "PMCC 4th Watch",
          });

          sentCount++;
        } catch (error) {
          console.error("Email send failed:", error);
          errors.push({
            recipient: recipient.guestEmail || recipient.guestName,
            error: "Email failed",
          });
        }
      }

      // Send SMS if campaign type includes SMS
      if (
        (campaign.type === "sms" || campaign.type === "both") &&
        recipient.guestPhone
      ) {
        try {
          const smsContent = replacePlaceholders(
            campaign.smsContent || "",
            campaignData
          );

          // Send SMS using Twilio
          await sendRegistrationSMS({
            to: recipient.guestPhone,
            guestName: recipient.guestName,
            eventTitle: event.title,
            ticketUrl: ticketUrl,
          });

          sentCount++;
        } catch (error) {
          console.error("SMS send failed:", error);
          errors.push({
            recipient: recipient.guestPhone || recipient.guestName,
            error: "SMS failed",
          });
        }
      }
    }

    // Update campaign status
    await updateCampaignStatus(payload, campaignId, "sent", sentCount);

    return NextResponse.json({
      success: true,
      message: `Campaign sent to ${sentCount} recipient(s)`,
      sentCount,
      totalRecipients: recipients.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Campaign send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Preview campaign recipients
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { id: campaignId } = await params;

    // Get the campaign
    const campaign = await payload.findByID({
      collection: "campaigns",
      id: campaignId,
      depth: 1,
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const event = campaign.event as { id?: string } | null;

    if (!event?.id) {
      return NextResponse.json(
        { error: "Event not found for this campaign" },
        { status: 400 }
      );
    }

    // Get recipient count
    const recipients = await getRecipients(
      payload,
      event.id,
      campaign.targetAudience as "all" | "notAttended" | "attended" | "notBaptized"
    );

    // Count by contact method
    const withEmail = recipients.filter((r) => r.guestEmail).length;
    const withPhone = recipients.filter((r) => r.guestPhone).length;

    return NextResponse.json({
      campaignId: campaign.id,
      campaignName: campaign.name,
      type: campaign.type,
      targetAudience: campaign.targetAudience,
      totalRecipients: recipients.length,
      withEmail,
      withPhone,
      recipients: recipients.slice(0, 10), // Return first 10 for preview
    });
  } catch (error) {
    console.error("Campaign preview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
