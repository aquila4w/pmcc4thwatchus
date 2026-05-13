// SMS service using Twilio
// To enable: Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env

interface SendSMSParams {
  to: string;
  guestName: string;
  eventTitle: string;
  ticketUrl: string;
  customMessage?: string;
  invitedByName?: string;
  invitedByPhone?: string;
}

export async function sendRegistrationSMS({
  to,
  guestName,
  eventTitle,
  ticketUrl,
  customMessage,
  invitedByName,
  invitedByPhone,
}: SendSMSParams): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error("[SMS] Missing env vars:", {
      hasSid: !!accountSid,
      hasToken: !!authToken,
      hasFrom: !!fromNumber,
    });
    return { success: false, error: "SMS service not configured" };
  }

  // Clean phone number - remove non-digits except leading +
  const cleanPhone = to.startsWith("+")
    ? "+" + to.slice(1).replace(/\D/g, "")
    : to.replace(/\D/g, "");

  // Ensure it has country code (default to US +1)
  const phoneNumber = cleanPhone.startsWith("+")
    ? cleanPhone
    : `+1${cleanPhone}`;

  const contactSuffix = invitedByName
    ? ` Questions? Contact ${invitedByName}${invitedByPhone ? ` at ${invitedByPhone}` : ""}.`
    : "";
  const message = customMessage || `Hi ${guestName}! You're registered for ${eventTitle}. View your ticket & QR code: ${ticketUrl}${contactSuffix} Reply STOP to unsubscribe.`;

  console.log("[SMS] Sending message");

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[SMS] Send failed");
      return { success: false, error: errorData.message || "Failed to send SMS" };
    }

    const data = await response.json();
    console.log("[SMS] Message sent successfully");
    return { success: true };
  } catch (error) {
    console.error("[SMS] Send failed");
    return { success: false, error: "Failed to send SMS" };
  }
}

// Built-in short URL helper — uses /t/[code] redirect route
export function getShortTicketUrl(registrationCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "https://pmcc4thwatch.us";
  return `${baseUrl}/t/${registrationCode}`;
}

// Legacy — kept for backwards compatibility
export async function shortenUrl(url: string): Promise<string> {
  return url;
}
