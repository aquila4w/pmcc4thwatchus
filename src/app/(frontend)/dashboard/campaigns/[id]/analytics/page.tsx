"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Mail,
  MessageSquare,
  Send,
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  RefreshCw,
  Download,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock campaign data
const campaignData = {
  id: "camp-003",
  name: "Registration Confirmation",
  event: "Soul Winning Summit",
  type: "email",
  status: "sent",
  sentAt: "2026-02-28T14:00:00",
  totalRecipients: 89,
  delivered: 87,
  bounced: 2,
  opened: 68,
  clicked: 40,
  unsubscribed: 1,
  complained: 0,
};

// Mock hourly data for charts
const hourlyData = [
  { hour: "2PM", opens: 45, clicks: 25 },
  { hour: "3PM", opens: 12, clicks: 8 },
  { hour: "4PM", opens: 5, clicks: 4 },
  { hour: "5PM", opens: 3, clicks: 2 },
  { hour: "6PM", opens: 2, clicks: 1 },
  { hour: "7PM", opens: 1, clicks: 0 },
];

// Mock recipient activity
const recipientActivity = [
  { name: "John Doe", email: "john.doe@email.com", status: "opened", time: "2026-02-28T14:05:00" },
  { name: "Jane Smith", email: "jane.smith@email.com", status: "clicked", time: "2026-02-28T14:08:00" },
  { name: "Robert Johnson", email: "robert.j@email.com", status: "opened", time: "2026-02-28T14:12:00" },
  { name: "Maria Garcia", email: "maria.g@email.com", status: "delivered", time: "2026-02-28T14:00:00" },
  { name: "David Lee", email: "david.lee@email.com", status: "bounced", time: "2026-02-28T14:00:00" },
];

const stats = [
  {
    label: "Delivered",
    value: campaignData.delivered,
    total: campaignData.totalRecipients,
    percentage: Math.round((campaignData.delivered / campaignData.totalRecipients) * 100),
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-100",
  },
  {
    label: "Open Rate",
    value: campaignData.opened,
    total: campaignData.delivered,
    percentage: Math.round((campaignData.opened / campaignData.delivered) * 100),
    icon: Eye,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
    benchmark: 21.33,
  },
  {
    label: "Click Rate",
    value: campaignData.clicked,
    total: campaignData.delivered,
    percentage: Math.round((campaignData.clicked / campaignData.delivered) * 100),
    icon: MousePointerClick,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
    benchmark: 2.62,
  },
  {
    label: "Bounce Rate",
    value: campaignData.bounced,
    total: campaignData.totalRecipients,
    percentage: Math.round((campaignData.bounced / campaignData.totalRecipients) * 100),
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-100",
    benchmark: 0.58,
    lowerIsBetter: true,
  },
];

export default function CampaignAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("24h");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "opened":
        return <Eye className="w-4 h-4 text-blue-500" />;
      case "clicked":
        return <MousePointerClick className="w-4 h-4 text-purple-500" />;
      case "delivered":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "bounced":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Mail className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "opened":
        return <Badge className="bg-blue-100 text-blue-700">Opened</Badge>;
      case "clicked":
        return <Badge className="bg-purple-100 text-purple-700">Clicked</Badge>;
      case "delivered":
        return <Badge className="bg-green-100 text-green-700">Delivered</Badge>;
      case "bounced":
        return <Badge className="bg-red-100 text-red-700">Bounced</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600">{status}</Badge>;
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
                <Link href="/dashboard/campaigns">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{campaignData.name}</h1>
                  <Badge className="bg-green-100 text-green-700">Sent</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Event: {campaignData.event} • Sent {new Date(campaignData.sentAt).toLocaleDateString("en-US", {
                    dateStyle: "medium",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                {stat.benchmark && (
                  <div className="flex items-center gap-1 text-xs">
                    {stat.lowerIsBetter ? (
                      stat.percentage <= stat.benchmark ? (
                        <TrendingDown className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-red-500" />
                      )
                    ) : stat.percentage >= stat.benchmark ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-orange-500" />
                    )}
                    <span className="text-muted-foreground">
                      vs {stat.benchmark}% avg
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold">{stat.percentage}%</p>
                <p className="text-sm text-muted-foreground">
                  {stat.value} of {stat.total} {stat.label.toLowerCase().replace(" rate", "")}
                </p>
              </div>
              {/* Progress bar */}
              <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    stat.color === "text-green-500" ? "bg-green-500" :
                    stat.color === "text-blue-500" ? "bg-blue-500" :
                    stat.color === "text-purple-500" ? "bg-purple-500" :
                    "bg-red-500"
                  }`}
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Engagement Over Time */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg">Engagement Over Time</h2>
              <div className="flex gap-2">
                {["24h", "7d", "30d"].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      timeRange === range
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Simple bar chart visualization */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  Opens
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  Clicks
                </span>
              </div>

              <div className="flex items-end gap-4 h-48">
                {hourlyData.map((data, index) => {
                  const maxValue = Math.max(...hourlyData.map(d => d.opens));
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center gap-1 flex-1 justify-end">
                        <div
                          className="w-full bg-blue-500/20 rounded-t relative overflow-hidden"
                          style={{ height: `${(data.opens / maxValue) * 100}%` }}
                        >
                          <div
                            className="absolute bottom-0 w-full bg-blue-500"
                            style={{ height: `${(data.opens / maxValue) * 100}%` }}
                          />
                        </div>
                        <div
                          className="w-1/2 bg-purple-500 rounded-t"
                          style={{ height: `${(data.clicks / maxValue) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{data.hour}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-6">Campaign Details</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Type
                </span>
                <Badge variant="outline">Email</Badge>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Recipients
                </span>
                <span className="font-semibold">{campaignData.totalRecipients}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Sent Date
                </span>
                <span className="font-semibold">
                  {new Date(campaignData.sentAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Send Time
                </span>
                <span className="font-semibold">
                  {new Date(campaignData.sentAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Unsubscribed
                </span>
                <span className="font-semibold">{campaignData.unsubscribed}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recipient Activity */}
        <Card className="mt-6">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Recipient Activity</h2>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="opened">Opened</TabsTrigger>
                  <TabsTrigger value="clicked">Clicked</TabsTrigger>
                  <TabsTrigger value="bounced">Bounced</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Recipient</th>
                  <th className="text-left p-4 font-semibold text-sm">Status</th>
                  <th className="text-left p-4 font-semibold text-sm">Time</th>
                  <th className="text-right p-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recipientActivity.map((activity, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {getStatusIcon(activity.status)}
                        </div>
                        <div>
                          <p className="font-medium">{activity.name}</p>
                          <p className="text-sm text-muted-foreground">{activity.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(activity.status)}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(activity.time).toLocaleString("en-US", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm">
                        View Details
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t text-center">
            <Button variant="outline">
              Load More
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
