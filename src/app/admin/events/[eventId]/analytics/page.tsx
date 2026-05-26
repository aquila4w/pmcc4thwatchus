"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { formatEventDate } from "@/lib/event-date";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  UserCheck,
  Clock,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
  ScanLine,
  Globe,
  Monitor,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- Types ---

interface EventStats {
  totalRegistrations?: number;
  attendedCount?: number;
  baptizedCount?: number;
  waitlistedCount?: number;
  spotsRemaining?: number;
}

interface Registration {
  id: string;
  status: string;
  registeredAt?: string;
  invitedByChurch?: {
    id: string;
    name: string;
  };
}

interface ScanStats {
  totalScans: number;
  memberScans: number;
  churchScans: number;
  totalRegistrations: number;
  conversionRate: {
    member: number;
    church: number;
    overall: number;
  };
  deviceBreakdown: { device: string; scans: number; registered: number; conversionRate: number }[];
  browserBreakdown: { browser: string; scans: number; registered: number; conversionRate: number }[];
  osBreakdown: { os: string; scans: number; registered: number; conversionRate: number }[];
  locationBreakdown: { city: string; region: string; country: string; scans: number; registered: number; conversionRate: number }[];
  scanTimeline: { date: string; memberScans: number; churchScans: number; registered: number }[];
}

// --- Component ---

export default function EventAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [stats, setStats] = useState<EventStats>({});
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [scanStats, setScanStats] = useState<ScanStats | null>(null);
  const [event, setEvent] = useState<{
    title?: string;
    startDate?: string;
    location?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, regsRes, eventRes, scanRes] = await Promise.all([
        fetch(`/api/events/${eventId}/stats`),
        fetch(`/api/managed-events/${eventId}/registrations?limit=999`),
        fetch(`/api/managed-events/${eventId}`),
        fetch(`/api/events/${eventId}/scan-stats`),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (regsRes.ok) {
        const regsData = await regsRes.json();
        setRegistrations(regsData.docs || []);
      }
      if (eventRes.ok) {
        setEvent(await eventRes.json());
      }
      if (scanRes.ok) {
        setScanStats(await scanRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Registration metrics ---
  const churchBreakdown = registrations.reduce((acc, reg) => {
    const churchName = reg.invitedByChurch?.name || "Unknown";
    acc[churchName] = (acc[churchName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const attendanceRate =
    stats.totalRegistrations && stats.totalRegistrations > 0
      ? Math.round(((stats.attendedCount || 0) / stats.totalRegistrations) * 100)
      : 0;

  const baptismRate =
    stats.attendedCount && stats.attendedCount > 0
      ? Math.round(((stats.baptizedCount || 0) / stats.attendedCount) * 100)
      : 0;

  const statusDistribution = registrations.reduce((acc, reg) => {
    acc[reg.status] = (acc[reg.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // --- Breakdown bar component ---
  function BreakdownBars({
    items,
    labelKey,
  }: {
    items: { scans: number; conversionRate: number; [k: string]: unknown }[];
    labelKey: string;
  }) {
    if (items.length === 0) {
      return <p className="text-slate-500 text-center py-4">No data available</p>;
    }
    const maxScans = Math.max(...items.map((i) => i.scans), 1);
    return (
      <div className="space-y-3">
        {items
          .sort((a, b) => b.scans - a.scans)
          .map((item) => {
            const pct = Math.round((item.scans / maxScans) * 100);
            return (
              <div key={String(item[labelKey])}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="capitalize truncate">{String(item[labelKey])}</span>
                  <span className="text-slate-500">
                    {item.scans} scan{item.scans !== 1 ? "s" : ""} &middot; {item.conversionRate}% conv.
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-slate-500">Event insights and metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="registrations">
        <TabsList>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="scans">Scan Analytics</TabsTrigger>
        </TabsList>

        {/* ===== REGISTRATIONS TAB ===== */}
        <TabsContent value="registrations" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.totalRegistrations || 0}</p>
                  <p className="text-sm text-slate-500">Total Registrations</p>
                </div>
              </div>
            </Card>
            <Card className="bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{attendanceRate}%</p>
                  <p className="text-sm text-slate-500">Attendance Rate</p>
                </div>
              </div>
            </Card>
            <Card className="bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{baptismRate}%</p>
                  <p className="text-sm text-slate-500">Baptism Rate</p>
                </div>
              </div>
            </Card>
            <Card className="bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.baptizedCount || 0}</p>
                  <p className="text-sm text-slate-500">Total Baptized</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Status Distribution + Church Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white p-6">
              <h3 className="font-semibold mb-4">Registration Status</h3>
              <div className="space-y-3">
                {Object.entries(statusDistribution).map(([status, count]) => {
                  const percentage =
                    stats.totalRegistrations && stats.totalRegistrations > 0
                      ? Math.round((count / stats.totalRegistrations) * 100)
                      : 0;
                  const statusColors: Record<string, string> = {
                    registered: "bg-blue-500",
                    attended: "bg-green-500",
                    baptized: "bg-purple-500",
                    waitlisted: "bg-yellow-500",
                    cancelled: "bg-red-500",
                    invited: "bg-slate-500",
                  };
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="capitalize">{status.replace("-", " ")}</span>
                        <span className="text-slate-500">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${statusColors[status] || "bg-slate-500"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(statusDistribution).length === 0 && (
                  <p className="text-slate-500 text-center py-4">No data available</p>
                )}
              </div>
            </Card>

            <Card className="bg-white p-6">
              <h3 className="font-semibold mb-4">Registrations by Church</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(churchBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([church, count]) => {
                    const percentage =
                      stats.totalRegistrations && stats.totalRegistrations > 0
                        ? Math.round((count / stats.totalRegistrations) * 100)
                        : 0;
                    return (
                      <div key={church}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="truncate">{church}</span>
                          <span className="text-slate-500">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                {Object.keys(churchBreakdown).length === 0 && (
                  <p className="text-slate-500 text-center py-4">No data available</p>
                )}
              </div>
            </Card>
          </div>

          {/* Event Info */}
          <Card className="bg-white p-6">
            <h3 className="font-semibold mb-4">Event Information</h3>
            {event ? (
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Event Name</p>
                  <p className="font-medium">{event.title}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Date & Time</p>
                  <p className="font-medium">
                    {event.startDate
                      ? formatEventDate(event.startDate)
                      : "TBD"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Location</p>
                  <p className="font-medium">{event.location || "TBD"}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">Loading event information...</p>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/admin/events/${eventId}/registrations`}>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Registrations
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/admin/events/${eventId}/check-in`}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Open Check-In Scanner
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/admin/campaigns/new?eventId=${eventId}`}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Create Reminder Campaign
                </Link>
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ===== SCAN ANALYTICS TAB ===== */}
        <TabsContent value="scans" className="space-y-6">
          {!scanStats ? (
            <Card className="bg-white p-6">
              <p className="text-slate-500 text-center">No scan data available</p>
            </Card>
          ) : (
            <>
              {/* Scan Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <ScanLine className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{scanStats.totalScans}</p>
                      <p className="text-sm text-slate-500">Total Scans</p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-white p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{scanStats.memberScans}</p>
                      <p className="text-sm text-slate-500">Member Scans</p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-white p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{scanStats.churchScans}</p>
                      <p className="text-sm text-slate-500">Church Ad Scans</p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-white p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{scanStats.conversionRate.overall}%</p>
                      <p className="text-sm text-slate-500">Overall Conversion</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Device / Browser / OS Breakdown */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-white p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> Device Breakdown
                  </h3>
                  <BreakdownBars items={scanStats.deviceBreakdown} labelKey="device" />
                </Card>
                <Card className="bg-white p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Browser Breakdown
                  </h3>
                  <BreakdownBars items={scanStats.browserBreakdown} labelKey="browser" />
                </Card>
                <Card className="bg-white p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> OS Breakdown
                  </h3>
                  <BreakdownBars items={scanStats.osBreakdown} labelKey="os" />
                </Card>
              </div>

              {/* Location Demographics */}
              <Card className="bg-white p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location Demographics
                </h3>
                {scanStats.locationBreakdown.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">
                    Location data will appear as new scans are recorded.
                  </p>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium text-slate-500">City</th>
                          <th className="text-left py-2 px-2 font-medium text-slate-500">Region</th>
                          <th className="text-left py-2 px-2 font-medium text-slate-500">Country</th>
                          <th className="text-right py-2 px-2 font-medium text-slate-500">Scans</th>
                          <th className="text-right py-2 px-2 font-medium text-slate-500">Registrations</th>
                          <th className="text-right py-2 px-2 font-medium text-slate-500">Conv. Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scanStats.locationBreakdown.map((loc, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 px-2">{loc.city || "—"}</td>
                            <td className="py-2 px-2">{loc.region || "—"}</td>
                            <td className="py-2 px-2">{loc.country || "—"}</td>
                            <td className="py-2 px-2 text-right">{loc.scans}</td>
                            <td className="py-2 px-2 text-right">{loc.registered}</td>
                            <td className="py-2 px-2 text-right">{loc.conversionRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Scan Timeline Chart */}
              <Card className="bg-white p-6">
                <h3 className="font-semibold mb-4">Scan Timeline</h3>
                {scanStats.scanTimeline.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">
                    Timeline data will appear as scans are recorded.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={scanStats.scanTimeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d: string) => {
                          const date = new Date(d + "T00:00:00");
                          return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        }}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(d) => {
                          const date = new Date(String(d) + "T00:00:00");
                          return date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });
                        }}
                      />
                      <Legend />
                      <Bar dataKey="memberScans" name="Member Scans" fill="#6366f1" />
                      <Bar dataKey="churchScans" name="Church Ad Scans" fill="#14b8a6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
