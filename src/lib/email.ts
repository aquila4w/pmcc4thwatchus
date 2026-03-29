import { Resend } from "resend";

// Lazy-load Resend client to avoid initialization errors during build
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface SendRegistrationEmailParams {
  to: string;
  guestName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  registrationCode: string;
  qrCodeUrl: string;
  ticketUrl: string;
  invitedByName?: string;
  invitedByPhone?: string;
  invitedByEmail?: string;
  invitedByChurch?: string;
  customHtml?: string;
  subject?: string;
}

export async function sendRegistrationEmail({
  to,
  guestName,
  eventTitle,
  eventDate,
  eventLocation,
  registrationCode,
  qrCodeUrl,
  ticketUrl,
  invitedByName,
  invitedByPhone,
  invitedByEmail,
  invitedByChurch,
  customHtml,
  subject: customSubject,
}: SendRegistrationEmailParams): Promise<{ success: boolean; error?: string }> {
  const client = getResendClient();
  if (!client) {
    console.warn("RESEND_API_KEY not configured, skipping email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.EMAIL_FROM || "PMCC 4th Watch <events@pmcc4thwatch.us>",
      to: [to],
      subject: customSubject || `Your Registration for ${eventTitle}`,
      html: customHtml || generateEmailHtml({
        guestName,
        eventTitle,
        eventDate,
        eventLocation,
        registrationCode,
        qrCodeUrl,
        ticketUrl,
        invitedByName,
        invitedByPhone,
        invitedByEmail,
        invitedByChurch,
      }),
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error: error.message };
    }

    console.log("Email sent successfully:", data?.id);
    return { success: true };
  } catch (error) {
    console.error("Email service error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

function generateEmailHtml({
  guestName,
  eventTitle,
  eventDate,
  eventLocation,
  registrationCode,
  qrCodeUrl,
  ticketUrl,
  invitedByName,
  invitedByPhone,
  invitedByEmail,
  invitedByChurch,
}: Omit<SendRegistrationEmailParams, "to">): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Registration Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2a4d7a 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">PMCC 4th Watch</h1>
              <p style="margin: 8px 0 0; color: #c9a227; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">Registration Confirmed</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Dear <strong>${guestName}</strong>,
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for registering! We're excited to have you join us at:
              </p>

              <!-- Event Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 16px; color: #1e3a5f; font-size: 22px;">${eventTitle}</h2>
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                      📅 <strong style="color: #374151;">${eventDate}</strong>
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      📍 <strong style="color: #374151;">${eventLocation}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              ${invitedByName ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9ee; border-radius: 8px; border: 1px solid #e5d9a8; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #1e3a5f; font-size: 14px; font-weight: 600;">
                      Invited By
                    </p>
                    <p style="margin: 0; color: #374151; font-size: 16px; font-weight: 600;">
                      ${invitedByName}
                    </p>
                    ${invitedByChurch ? `<p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">${invitedByChurch}</p>` : ""}
                    ${invitedByPhone ? `<p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">${invitedByPhone}</p>` : ""}
                    ${invitedByEmail ? `<p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">${invitedByEmail}</p>` : ""}
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- QR Code -->
              <div style="text-align: center; margin: 32px 0;">
                <p style="margin: 0 0 16px; color: #374151; font-size: 16px; font-weight: 600;">
                  Your Event Ticket
                </p>
                <div style="background-color: #ffffff; display: inline-block; padding: 16px; border: 2px solid #e5e7eb; border-radius: 12px;">
                  <img src="${qrCodeUrl}" alt="QR Code" width="200" height="200" style="display: block;">
                </div>
                <p style="margin: 16px 0 0; color: #1e3a5f; font-size: 24px; font-weight: 700; letter-spacing: 4px; font-family: monospace;">
                  ${registrationCode}
                </p>
                <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px;">
                  Present this QR code at the event check-in
                </p>
              </div>

              <!-- Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${ticketUrl}" style="display: inline-block; background-color: #c9a227; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Your Ticket Online
                </a>
              </div>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Save this email or take a screenshot of your QR code. You can also access your ticket anytime at the link above.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                Pentecostal Missionary Church of Christ (4th Watch)
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                US District
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Reminder email types and function
interface SendReminderEmailParams {
  to: string;
  guestName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketUrl: string;
  reminderType: "day-before" | "hour-before";
}

export async function sendReminderEmail({
  to,
  guestName,
  eventTitle,
  eventDate,
  eventLocation,
  ticketUrl,
  reminderType,
}: SendReminderEmailParams): Promise<{ success: boolean; error?: string }> {
  const client = getResendClient();
  if (!client) {
    console.warn("RESEND_API_KEY not configured, skipping reminder email");
    return { success: false, error: "Email service not configured" };
  }

  const subject = reminderType === "day-before"
    ? `Reminder: ${eventTitle} is Tomorrow!`
    : `Starting Soon: ${eventTitle} begins in 1 hour!`;

  const urgencyMessage = reminderType === "day-before"
    ? "is happening <strong>tomorrow</strong>"
    : "is starting <strong>in just 1 hour</strong>";

  try {
    const { data, error } = await client.emails.send({
      from: process.env.EMAIL_FROM || "PMCC 4th Watch <events@pmcc4thwatch.us>",
      to: [to],
      subject,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #c9a227 0%, #d4b445 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #1e3a5f; font-size: 24px; font-weight: 600;">${reminderType === "hour-before" ? "Starting Soon!" : "Event Reminder"}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi <strong>${guestName}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Just a friendly reminder that <strong>${eventTitle}</strong> ${urgencyMessage}!
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 16px; color: #1e3a5f; font-size: 20px;">${eventTitle}</h2>
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">📅 <strong style="color: #374151;">${eventDate}</strong></p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">📍 <strong style="color: #374151;">${eventLocation}</strong></p>
                  </td>
                </tr>
              </table>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${ticketUrl}" style="display: inline-block; background-color: #1e3a5f; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Your Ticket
                </a>
              </div>
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Don't forget to bring your QR code for check-in. We look forward to seeing you!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">PMCC 4th Watch - US District</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });

    if (error) {
      console.error("Reminder email error:", error);
      return { success: false, error: error.message };
    }

    console.log("Reminder email sent:", data?.id);
    return { success: true };
  } catch (error) {
    console.error("Reminder email service error:", error);
    return { success: false, error: "Failed to send reminder email" };
  }
}
