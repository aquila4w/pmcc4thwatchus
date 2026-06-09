"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Mail,
  MessageSquare,
  Users,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Campaign {
  id: string;
  name: string;
  event: { id: string; title: string } | string;
  type: "sms" | "email" | "both";
  status: string;
  targetAudience: string;
  sentCount: number;
  lastSentAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
}

interface Preview {
  totalRecipients: number;
  withEmail: number;
  withPhone: number;
  recipients: Array<{ guestName: string }>;
}

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [campaignRes, previewRes] = await Promise.all([
          fetch(`/payload-api/campaigns/${campaignId}?depth=1`),
          fetch(`/api/campaigns/${campaignId}/send`).catch(() => null),
        ]);

        if (campaignRes.ok) {
          const data = await campaignRes.json();
          setCampaign(data);
        }

        if (previewRes?.ok) {
          const data = await previewRes.json();
          setPreview(data);
        }
      } catch (err) {
        console.error("Failed to fetch campaign:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [campaignId]);

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-slate-100 text-slate-700";
      case "scheduled": return "bg-blue-100 text-blue-700";
      case "sending": return "bg-yellow-100 text-yellow-700";
      case "sent": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Campaign not found</h2>
        <Button asChild>
          <Link href="/admin/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    );
  }

  const eventData = campaign.event as { id?: string; title?: string } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/campaigns">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-slate-500">Campaign Analytics</p>
        </div>
        <Badge className={getStatusColor(campaign.status)}>
          {campaign.status}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{preview?.totalRecipients ?? "-"}</p>
              <p className="text-xs text-slate-500">Recipients</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{campaign.sentCount}</p>
              <p className="text-xs text-slate-500">Sent</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{preview?.withEmail ?? "-"}</p>
              <p className="text-xs text-slate-500">With Email</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{preview?.withPhone ?? "-"}</p>
              <p className="text-xs text-slate-500">With Phone</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Details */}
      <Card className="bg-white p-6">
        <h3 className="font-semibold mb-4">Campaign Details</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Event:</span>{" "}
            <span className="font-medium">{eventData?.title || "Unknown"}</span>
          </div>
          <div>
            <span className="text-slate-500">Type:</span>{" "}
            <span className="font-medium">{(campaign.type || "").toUpperCase()}</span>
          </div>
          <div>
            <span className="text-slate-500">Target Audience:</span>{" "}
            <span className="font-medium capitalize">{(campaign.targetAudience || "all").replace(/([A-Z])/g, " $1")}</span>
          </div>
          <div>
            <span className="text-slate-500">Created:</span>{" "}
            <span className="font-medium">{formatDate(campaign.createdAt)}</span>
          </div>
          {campaign.scheduledAt && (
            <div>
              <span className="text-slate-500">Scheduled:</span>{" "}
              <span className="font-medium">{formatDate(campaign.scheduledAt)}</span>
            </div>
          )}
          {campaign.lastSentAt && (
            <div>
              <span className="text-slate-500">Last Sent:</span>{" "}
              <span className="font-medium">{formatDate(campaign.lastSentAt)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Sample Recipients */}
      {preview && preview.recipients.length > 0 && (
        <Card className="bg-white p-6">
          <h3 className="font-semibold mb-4">
            Sample Recipients (showing first {preview.recipients.length})
          </h3>
          <ul className="space-y-2">
            {preview.recipients.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {r.guestName}
              </li>
            ))}
          </ul>
          {preview.totalRecipients > preview.recipients.length && (
            <p className="text-sm text-slate-500 mt-3">
              ...and {preview.totalRecipients - preview.recipients.length} more
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
