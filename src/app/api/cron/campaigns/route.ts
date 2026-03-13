import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

// Verify cron authorization
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "dev-cron-secret";

  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // For Vercel Cron, you might use a different method
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return false;
}

// GET or POST - Process scheduled campaigns
export async function GET(request: NextRequest) {
  return processScheduledCampaigns(request);
}

export async function POST(request: NextRequest) {
  return processScheduledCampaigns(request);
}

async function processScheduledCampaigns(request: NextRequest) {
  try {
    // Verify authorization in production
    if (process.env.NODE_ENV === "production" && !verifyCronAuth(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await getPayload({ config });
    const now = new Date();

    // Find campaigns that are scheduled and due to be sent
    const campaigns = await payload.find({
      collection: "campaigns",
      where: {
        and: [
          { status: { equals: "scheduled" } },
          { scheduledAt: { less_than_equal: now.toISOString() } },
        ],
      },
      limit: 20,
      depth: 2,
    });

    let processedCount = 0;

    for (const campaign of campaigns.docs) {
      try {
        // Trigger campaign send
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/api/campaigns/${campaign.id}/send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          processedCount++;
        } else {
          console.error(`Campaign ${campaign.id} send failed:`, await response.text());
        }
      } catch (error) {
        console.error(`Error processing campaign ${campaign.id}:`, error);
      }
    }

    // Also check for daily/weekly recurring campaigns
    const recurringCampaigns = await payload.find({
      collection: "campaigns",
      where: {
        and: [
          { status: { equals: "sent" } },
          {
            frequency: {
              in: ["daily", "weekly"],
            },
          },
        ],
      },
      limit: 20,
      depth: 0,
    });

    for (const campaign of recurringCampaigns.docs) {
      const lastSentAt = campaign.lastSentAt ? new Date(campaign.lastSentAt) : null;
      if (!lastSentAt) continue;

      const hoursSinceLastSent = (now.getTime() - lastSentAt.getTime()) / (1000 * 60 * 60);
      const shouldSend =
        campaign.frequency === "daily" && hoursSinceLastSent >= 24;
      const shouldSendWeekly =
        campaign.frequency === "weekly" && hoursSinceLastSent >= 168; // 7 days

      if (shouldSend || shouldSendWeekly) {
        try {
          // Reset to scheduled and update scheduledAt to now
          await payload.update({
            collection: "campaigns",
            id: campaign.id,
            data: {
              status: "scheduled",
              scheduledAt: now.toISOString(),
            },
          });
        } catch (error) {
          console.error(`Error rescheduling campaign ${campaign.id}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} scheduled campaign(s)`,
      processedCount,
      totalFound: campaigns.totalDocs,
    });
  } catch (error) {
    console.error("Campaign cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
