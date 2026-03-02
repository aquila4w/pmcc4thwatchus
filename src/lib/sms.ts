// SMS service using Twilio
// To enable: Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env

interface SendSMSParams {
  to: string;
  guestName: string;
  eventTitle: string;
  ticketUrl: string;
}

export async function sendRegistrationSMS({
  to,
  guestName,
  eventTitle,
  ticketUrl,
}: SendSMSParams): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("Twilio not configured, skipping SMS");
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

  const message = `Hi ${guestName}! You're registered for ${eventTitle}. View your ticket & QR code: ${ticketUrl}`;

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
      console.error("Twilio error:", errorData);
      return { success: false, error: errorData.message || "Failed to send SMS" };
    }

    const data = await response.json();
    console.log("SMS sent successfully:", data.sid);
    return { success: true };
  } catch (error) {
    console.error("SMS service error:", error);
    return { success: false, error: "Failed to send SMS" };
  }
}

// URL shortening using TinyURL (free, no API key needed)
export async function shortenUrl(url: string): Promise<string> {
  try {
    const response = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    );

    if (response.ok) {
      return await response.text();
    }
    return url; // Return original if shortening fails
  } catch {
    return url; // Return original if shortening fails
  }
}
