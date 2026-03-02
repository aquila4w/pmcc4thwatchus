"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  MessageSquare,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  Clock,
  Users,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Calendar,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Campaign {
  id: string;
  name: string;
  event: string;
  type: "sms" | "email" | "both";
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
  scheduledAt: string | null;
  sentCount: number;
  totalRecipients: number;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: "camp-001",
    name: "Event Reminder - 1 Week Before",
    event: "Spiritual Empowerment Day 1",
    type: "both",
    status: "scheduled",
    scheduledAt: "2026-03-08T09:00:00",
    sentCount: 0,
    totalRecipients: 156,
    createdAt: "2026-03-01T10:00:00",
  },
  {
    id: "camp-002",
    name: "Event Reminder - 1 Day Before",
    event: "Spiritual Empowerment Day 1",
    type: "sms",
    status: "scheduled",
    scheduledAt: "2026-03-14T18:00:00",
    sentCount: 0,
    totalRecipients: 156,
    createdAt: "2026-03-01T10:00:00",
  },
  {
    id: "camp-003",
    name: "Registration Confirmation",
    event: "Soul Winning Summit",
    type: "email",
    status: "sent",
    scheduledAt: null,
    sentCount: 89,
    totalRecipients: 89,
    openRate: 78,
    clickRate: 45,
    createdAt: "2026-02-28T14:00:00",
  },
  {
    id: "camp-004",
    name: "Thank You Message",
    event: "Youth Fellowship Night",
    type: "email",
    status: "draft",
    scheduledAt: null,
    sentCount: 0,
    totalRecipients: 0,
    createdAt: "2026-03-01T09:00:00",
  },
];

const stats = [
  { label: "Total Campaigns", value: "12", icon: Mail, color: "bg-blue-500" },
  { label: "Messages Sent", value: "1,234", icon: Send, color: "bg-green-500" },
  { label: "Open Rate", value: "72%", icon: Eye, color: "bg-purple-500" },
  { label: "Click Rate", value: "34%", icon: TrendingUp, color: "bg-orange-500" },
];

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredCampaigns = mockCampaigns.filter(campaign => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.event.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-slate-100 text-slate-600";
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

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold">Campaigns</h1>
                <p className="text-sm text-muted-foreground">Manage SMS and email campaigns</p>
              </div>
            </div>
            <Button asChild>
              <Link href="/dashboard/campaigns/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Campaigns</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <TabsContent value="all" className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Campaign Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        campaign.type === "sms" ? "bg-green-100 text-green-600" :
                        campaign.type === "email" ? "bg-blue-100 text-blue-600" :
                        "bg-purple-100 text-purple-600"
                      }`}>
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
                        <p className="text-sm text-muted-foreground mt-1">
                          Event: {campaign.event}
                        </p>
                        {campaign.scheduledAt && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-4 h-4" />
                            Scheduled: {new Date(campaign.scheduledAt).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 lg:gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{campaign.totalRecipients}</p>
                      <p className="text-xs text-muted-foreground">Recipients</p>
                    </div>
                    {campaign.status === "sent" && (
                      <>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{campaign.openRate}%</p>
                          <p className="text-xs text-muted-foreground">Open Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{campaign.clickRate}%</p>
                          <p className="text-xs text-muted-foreground">Click Rate</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {campaign.status === "draft" && (
                      <Button variant="outline" size="sm">
                        <Play className="w-4 h-4 mr-1" />
                        Schedule
                      </Button>
                    )}
                    {campaign.status === "scheduled" && (
                      <Button variant="outline" size="sm">
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {campaign.status === "sent" && (
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Report
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}

            {filteredCampaigns.length === 0 && (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No campaigns found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first campaign to start reaching out to your guests
                </p>
                <Button asChild>
                  <Link href="/dashboard/campaigns/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled">
            <Card className="p-12 text-center">
              <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Scheduled Campaigns</h3>
              <p className="text-muted-foreground">
                View and manage campaigns scheduled to send in the future
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="sent">
            <Card className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Sent Campaigns</h3>
              <p className="text-muted-foreground">
                Review performance metrics for sent campaigns
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="draft">
            <Card className="p-12 text-center">
              <Edit className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Draft Campaigns</h3>
              <p className="text-muted-foreground">
                Continue working on campaigns you've started
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
