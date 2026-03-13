import { Payload } from "payload";

// Data structure for placeholder replacement
export interface CampaignData {
  name: string;
  event: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  qrLink: string;
  inviteCode: string;
}

// Replace placeholders in content
export function replacePlaceholders(
  content: string,
  data: CampaignData
): string {
  return content
    .replace(/\{\{name\}\}/g, data.name)
    .replace(/\{\{event\}\}/g, data.event)
    .replace(/\{\{eventDate\}\}/g, data.eventDate)
    .replace(/\{\{eventTime\}\}/g, data.eventTime)
    .replace(/\{\{eventLocation\}\}/g, data.eventLocation)
    .replace(/\{\{qrLink\}\}/g, data.qrLink)
    .replace(/\{\{inviteCode\}\}/g, data.inviteCode);
}

// Get recipients based on target audience
export async function getRecipients(
  payload: Payload,
  eventId: string,
  targetAudience: "all" | "notAttended" | "attended" | "notBaptized"
): Promise<Array<{
  id: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  inviteCode: string;
}>> {
  let whereClause: Record<string, unknown> = {
    event: { equals: eventId },
  };

  switch (targetAudience) {
    case "all":
      whereClause.status = {
        in: ["registered", "attended", "baptized"],
      };
      break;
    case "notAttended":
      whereClause.status = { equals: "registered" };
      break;
    case "attended":
      whereClause.status = { equals: "attended" };
      break;
    case "notBaptized":
      whereClause.status = {
        in: ["registered", "attended"],
      };
      break;
  }

  const registrations = await payload.find({
    collection: "event-registrations",
    where: whereClause,
    limit: 999,
    depth: 0,
  });

  return registrations.docs.map((reg) => {
    const guestInfo = reg.guestInfo as {
      name?: string;
      email?: string;
      phone?: string;
    } | null;

    return {
      id: reg.id,
      guestName: guestInfo?.name || "Guest",
      guestEmail: guestInfo?.email,
      guestPhone: guestInfo?.phone,
      inviteCode: reg.inviteCode,
    };
  });
}

// Format event date for campaigns
export function formatCampaignEventDate(startDate: string): {
  date: string;
  time: string;
} {
  const date = new Date(startDate);
  return {
    date: date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

// Update campaign status
export async function updateCampaignStatus(
  payload: Payload,
  campaignId: string,
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled",
  sentCount: number = 0
): Promise<void> {
  await payload.update({
    collection: "campaigns",
    id: campaignId,
    data: {
      status,
      sentCount,
      lastSentAt: new Date().toISOString(),
    },
  });
}

// Batch send with rate limiting
export async function batchSend<T, R>(
  items: T[],
  batchSize: number,
  delayMs: number,
  sender: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(sender));
    results.push(...batchResults);

    // Add delay between batches (except for the last batch)
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
