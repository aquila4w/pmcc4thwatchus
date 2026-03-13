"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  MessageSquare,
  Plus,
  Search,
  Play,
  Eye,
  Edit,
  Clock,
  Send,
  CheckCircle,
  Calendar,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Campaign {
  id: string;
  name: string;
  event?: {
    id: string;
    title: string;
  };
  type: "sms" | "email" | "both";
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
  scheduledAt: string | null;
  sentCount: number;
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/payload-api/campaigns?limit=999&sort=-createdAt&depth=1");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.docs || []);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    const confirmed = confirm("Are you sure you want to send this campaign now?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Campaign sending started!");
        await fetchCampaigns();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to send campaign");
      }
    } catch (error) {
      console.error("Failed to send campaign:", error);
      alert("Failed to send campaign");
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    return (
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.event?.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-slate-100 text-slate-700";
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "sending":
        return "bg-yellow-100 text-yellow-700";
      case "sent":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sms":
        return <MessageSquare className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "both":
        return (
          <div className="flex">
            <MessageSquare className="w-4 h-4" />
            <Mail className="w-4 h-4 -ml-1" />
          </div>
        );
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate stats
  const stats = {
    total: campaigns.length,
    sent: campaigns.filter((c) => c.status === "sent").length,
    scheduled: campaigns.filter((c) => c.status === "scheduled").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-slate-500">Manage SMS and email campaigns</p>
        </div>
        <Button asChild>
          <Link href="/cms/collections/campaigns/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Campaigns</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.sent}</p>
              <p className="text-xs text-slate-500">Sent</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
              <p className="text-xs text-slate-500">Scheduled</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Edit className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.draft}</p>
              <p className="text-xs text-slate-500">Drafts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Campaign List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({stats.scheduled})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({stats.sent})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({stats.draft})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-white p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Campaign Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        campaign.type === "sms"
                          ? "bg-green-100 text-green-600"
                          : campaign.type === "email"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-purple-100 text-purple-600"
                      }`}
                    >
                      {getTypeIcon(campaign.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {campaign.type.toUpperCase()}
                        </Badge>
                      </div>
                      {campaign.event && (
                        <p className="text-sm text-slate-500 mt-1">
                          Event: {campaign.event.title}
                        </p>
                      )}
                      {campaign.scheduledAt && campaign.status === "scheduled" && (
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <Clock className="w-4 h-4" />
                          Scheduled: {formatDate(campaign.scheduledAt)}
                        </p>
                      )}
                      {campaign.lastSentAt && (
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <Send className="w-4 h-4" />
                          Last sent: {formatDate(campaign.lastSentAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6">
                  {campaign.sentCount > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{campaign.sentCount}</p>
                      <p className="text-xs text-slate-500">Sent</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {campaign.status === "draft" && (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/cms/collections/campaigns/${campaign.id}`}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSendCampaign(campaign.id)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Send Now
                      </Button>
                    </>
                  )}
                  {campaign.status === "scheduled" && (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/cms/collections/campaigns/${campaign.id}`}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSendCampaign(campaign.id)}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Send Now
                      </Button>
                    </>
                  )}
                  {campaign.status === "sent" && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/cms/collections/campaigns/${campaign.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/cms/collections/campaigns/${campaign.id}`}>
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredCampaigns.length === 0 && (
            <Card className="bg-white p-12 text-center">
              <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                No campaigns found
              </h3>
              <p className="text-slate-500 mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first campaign to start reaching out to your guests"}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/cms/collections/campaigns/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Link>
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled">
          {filteredCampaigns.filter((c) => c.status === "scheduled").map((campaign) => (
            <Card key={campaign.id} className="bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{campaign.name}</h3>
                  <p className="text-sm text-slate-500">
                    {campaign.scheduledAt && formatDate(campaign.scheduledAt)}
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleSendCampaign(campaign.id)}
                >
                  <Send className="w-4 h-4 mr-1" />
                  Send Now
                </Button>
              </div>
            </Card>
          ))}
          {filteredCampaigns.filter((c) => c.status === "scheduled").length === 0 && (
            <Card className="bg-white p-12 text-center">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                No scheduled campaigns
              </h3>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {filteredCampaigns.filter((c) => c.status === "sent").map((campaign) => (
            <Card key={campaign.id} className="bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{campaign.name}</h3>
                  <p className="text-sm text-slate-500">
                    Sent: {campaign.lastSentAt && formatDate(campaign.lastSentAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">
                    {campaign.sentCount} sent
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
          {filteredCampaigns.filter((c) => c.status === "sent").length === 0 && (
            <Card className="bg-white p-12 text-center">
              <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                No sent campaigns yet
              </h3>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="draft">
          {filteredCampaigns.filter((c) => c.status === "draft").map((campaign) => (
            <Card key={campaign.id} className="bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{campaign.name}</h3>
                  <p className="text-sm text-slate-500">
                    Created: {formatDate(campaign.createdAt)}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/cms/collections/campaigns/${campaign.id}`}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
          {filteredCampaigns.filter((c) => c.status === "draft").length === 0 && (
            <Card className="bg-white p-12 text-center">
              <Edit className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                No draft campaigns
              </h3>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
