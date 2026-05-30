"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  UserCheck,
  Calendar,
  TrendingUp,
  RefreshCw,
  Download,
  ScanLine,
  Globe,
  Monitor,
  MapPin,
  ChevronRight,
  ChevronDown,
  Church,
  Megaphone,
  BarChart3,
  Loader2,
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
import { MetricCard } from "@/components/admin/analytics/MetricCard";
import { BreakdownBars } from "@/components/admin/analytics/BreakdownBars";
import { SortableTable, type Column } from "@/components/admin/analytics/SortableTable";
import { DateRangeSelector } from "@/components/admin/analytics/DateRangeSelector";
import { CsvExport } from "@/components/admin/analytics/CsvExport";

// --- Types ---

interface AnalyticsData {
  overview: {
    totalRegistrations: number;
    attendedCount: number;
    baptizedCount: number;
    waitlistedCount: number;
    totalScans: number;
    memberScans: number;
    churchScans: number;
    platformScans: number;
    overallConversionRate: number;
    attendanceRate: number;
    baptismRate: number;
    statusDistribution: Record<string, number>;
    spotsRemaining: number | null;
    eventTitle: string | null;
    eventStartDate: string | null;
    eventLocation: string | null;
  };
  byChurch: {
    churchId: string;
    churchName: string;
    registrations: number;
    scans: number;
    conversionRate: number;
    attendedCount: number;
    baptizedCount: number;
    members: {
      memberId: string;
      memberName: string;
      inviteCode: string;
      scans: number;
      registrations: number;
      conversionRate: number;
    }[];
  }[];
  byPlacement: {
    placementId: string;
    placementName: string;
    scans: number;
    registrations: number;
    conversionRate: number;
  }[];
  byPlatform: {
    platformId: string;
    platformName: string;
    scans: number;
    registrations: number;
    conversionRate: number;
  }[];
  scanTimeline: {
    date: string;
    memberScans: number;
    churchScans: number;
    platformScans: number;
    registrations: number;
  }[];
  deviceBreakdown: { name: string; scans: number; conversionRate: number }[];
  browserBreakdown: { name: string; scans: number; conversionRate: number }[];
  osBreakdown: { name: string; scans: number; conversionRate: number }[];
  locationBreakdown: {
    city: string;
    region: string;
    country: string;
    scans: number;
    registered: number;
    conversionRate: number;
  }[];
  behavioralMetrics: {
    avgTimeOnPage: number | null;
    avgScrollDepth: number | null;
    avgFormStartDelay: number | null;
    rageClickCount: number;
    adBlockerDetectedCount: number;
    sampleSize: number;
  };
}

// --- Component ---

export default function EventAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string; label: string }>({
    label: "All Time",
  });
  const [expandedChurchId, setExpandedChurchId] = useState<string | null>(null);
  const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set());

  // Fetch overview (lightweight) on mount / date range change
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (dateRange.from) p.set("from", dateRange.from);
      if (dateRange.to) p.set("to", dateRange.to);
      p.set("section", "overview");

      const res = await fetch(`/api/events/${eventId}/analytics?${p.toString()}`);
      if (res.ok) {
        const sectionData = await res.json();
        setData((prev) => prev ? { ...prev, ...sectionData } : sectionData as AnalyticsData);
      }
    } catch (error) {
      console.error("Failed to fetch overview:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId, dateRange]);

  // Fetch a specific section lazily when a tab is activated
  const fetchSection = useCallback(async (section: string) => {
    if (!data) return;
    // Skip if already loaded
    if (loadedSections.has(section)) return;

    setSectionLoading(section);
    try {
      const p = new URLSearchParams();
      if (dateRange.from) p.set("from", dateRange.from);
      if (dateRange.to) p.set("to", dateRange.to);
      p.set("section", section);

      const res = await fetch(`/api/events/${eventId}/analytics?${p.toString()}`);
      if (res.ok) {
        const sectionData = await res.json();
        setData((prev) => prev ? { ...prev, ...sectionData } : sectionData as AnalyticsData);
        setLoadedSections((prev) => new Set(prev).add(section));
      }
    } catch (error) {
      console.error(`Failed to fetch ${section}:`, error);
    } finally {
      setSectionLoading(null);
    }
  }, [eventId, dateRange, data, loadedSections]);

  // Full refresh (overview + current tab)
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (dateRange.from) p.set("from", dateRange.from);
      if (dateRange.to) p.set("to", dateRange.to);

      const res = await fetch(`/api/events/${eventId}/analytics?${p.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId, dateRange]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Failed to load analytics data.</p>
      </div>
    );
  }

  const { overview } = data;

  // Ensure arrays exist for lazy-load checks (may be missing on initial overview fetch)
  const byChurch = data.byChurch || [];
  const byPlacement = data.byPlacement || [];
  const byPlatform = data.byPlatform || [];
  const scanTimeline = data.scanTimeline || [];
  const deviceBreakdown = data.deviceBreakdown || [];
  const browserBreakdown = data.browserBreakdown || [];
  const osBreakdown = data.osBreakdown || [];
  const locationBreakdown = data.locationBreakdown || [];
  const behavioralMetrics = data.behavioralMetrics || {
    avgTimeOnPage: null, avgScrollDepth: null, avgFormStartDelay: null,
    rageClickCount: 0, adBlockerDetectedCount: 0, sampleSize: 0,
  };

  // Column definitions
  const churchColumns: Column<(typeof byChurch)[0]>[] = [
    {
      key: "churchName",
      label: "Church",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.members.length > 0 && (
            expandedChurchId === row.churchId
              ? <ChevronDown className="w-4 h-4 text-slate-400" />
              : <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <span className="font-medium">{row.churchName}</span>
          <span className="text-xs text-slate-400">({row.members.length} members)</span>
        </div>
      ),
    },
    { key: "registrations", label: "Registrations", align: "right", compare: (a, b) => a.registrations - b.registrations },
    { key: "scans", label: "Scans", align: "right", compare: (a, b) => a.scans - b.scans },
    { key: "conversionRate", label: "Conv %", align: "right", render: (row) => `${row.conversionRate}%`, compare: (a, b) => a.conversionRate - b.conversionRate },
    { key: "attendedCount", label: "Attended", align: "right", compare: (a, b) => a.attendedCount - b.attendedCount },
    { key: "baptizedCount", label: "Baptized", align: "right", compare: (a, b) => a.baptizedCount - b.baptizedCount },
  ];

  const placementColumns: Column<(typeof byPlacement)[0]>[] = [
    { key: "placementName", label: "Placement" },
    { key: "scans", label: "Scans", align: "right", compare: (a, b) => a.scans - b.scans },
    { key: "registrations", label: "Registrations", align: "right", compare: (a, b) => a.registrations - b.registrations },
    { key: "conversionRate", label: "Conv %", align: "right", render: (row) => `${row.conversionRate}%`, compare: (a, b) => a.conversionRate - b.conversionRate },
  ];

  const platformColumns: Column<(typeof byPlatform)[0]>[] = [
    { key: "platformName", label: "Platform" },
    { key: "scans", label: "Scans", align: "right", compare: (a, b) => a.scans - b.scans },
    { key: "registrations", label: "Registrations", align: "right", compare: (a, b) => a.registrations - b.registrations },
    { key: "conversionRate", label: "Conv %", align: "right", render: (row) => `${row.conversionRate}%`, compare: (a, b) => a.conversionRate - b.conversionRate },
  ];

  // CSV export data
  const churchCsvData = byChurch.map((c) => ({
    Church: c.churchName,
    Registrations: c.registrations,
    Scans: c.scans,
    "Conv %": c.conversionRate,
    Attended: c.attendedCount,
    Baptized: c.baptizedCount,
    Members: c.members.length,
  }));

  const placementCsvData = byPlacement.map((p) => ({
    Placement: p.placementName,
    Scans: p.scans,
    Registrations: p.registrations,
    "Conv %": p.conversionRate,
  }));

  const platformCsvData = byPlatform.map((p) => ({
    Platform: p.platformName,
    Scans: p.scans,
    Registrations: p.registrations,
    "Conv %": p.conversionRate,
  }));

  // Helper: show loading skeleton for a section that hasn't loaded yet
  const sectionIsLoading = (section: string) =>
    sectionLoading === section || !loadedSections.has(section);

  const LoadingSkeleton = () => (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-slate-500">Loading data…</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {overview.eventTitle ? `Analytics: ${overview.eventTitle}` : "Analytics"}
            </h1>
            <div className="flex items-center gap-3 text-slate-500 text-sm">
              {overview.eventStartDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(overview.eventStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
              {overview.eventLocation && <span>{overview.eventLocation}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range + Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
        <CsvExport data={churchCsvData} filename={`analytics-event-${eventId}.csv`} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" onValueChange={(tab) => {
        const sectionMap: Record<string, string> = {
          overview: "overview",
          churches: "churches",
          placements: "placements",
          platforms: "platforms",
          technical: "technical",
        };
        const section = sectionMap[tab];
        if (section) fetchSection(section);
      }}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="churches">
            <Church className="w-4 h-4 mr-1" />
            By Church
          </TabsTrigger>
          <TabsTrigger value="placements">
            <Megaphone className="w-4 h-4 mr-1" />
            By Placement
          </TabsTrigger>
          <TabsTrigger value="platforms">
            <Globe className="w-4 h-4 mr-1" />
            By Platform
          </TabsTrigger>
          <TabsTrigger value="technical">
            <Monitor className="w-4 h-4 mr-1" />
            Technical
          </TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard icon={Users} value={overview.totalRegistrations} label="Total Registrations" iconBg="bg-blue-100" iconColor="text-blue-600" />
            <MetricCard icon={CheckCircle} value={`${overview.attendanceRate}%`} label="Attendance Rate" iconBg="bg-green-100" iconColor="text-green-600" />
            <MetricCard icon={UserCheck} value={`${overview.baptismRate}%`} label="Baptism Rate" iconBg="bg-purple-100" iconColor="text-purple-600" />
            <MetricCard icon={ScanLine} value={overview.totalScans} label="Total Scans" iconBg="bg-indigo-100" iconColor="text-indigo-600" />
            <MetricCard icon={TrendingUp} value={`${overview.overallConversionRate}%`} label="Conversion Rate" iconBg="bg-yellow-100" iconColor="text-yellow-600" />
            <MetricCard icon={UserCheck} value={overview.baptizedCount} label="Total Baptized" iconBg="bg-pink-100" iconColor="text-pink-600" />
          </div>

          {/* Source breakdown mini-cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-white p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{overview.memberScans}</p>
              <p className="text-xs text-slate-500">Member Scans</p>
            </Card>
            <Card className="bg-white p-4 text-center">
              <p className="text-2xl font-bold text-teal-600">{overview.churchScans}</p>
              <p className="text-xs text-slate-500">Church Ad Scans</p>
            </Card>
            <Card className="bg-white p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{overview.platformScans}</p>
              <p className="text-xs text-slate-500">Platform Scans</p>
            </Card>
          </div>

          {/* Scan Timeline */}
          <Card className="bg-white p-6">
            <h3 className="font-semibold mb-4">Scan Timeline</h3>
            {scanTimeline.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Timeline data will appear as scans are recorded.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scanTimeline}>
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
                  <Bar dataKey="platformScans" name="Platform Scans" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Status Distribution */}
          <Card className="bg-white p-6">
            <h3 className="font-semibold mb-4">Registration Status Distribution</h3>
            <div className="space-y-3">
              {Object.entries(overview.statusDistribution).map(([status, count]) => {
                const percentage = overview.totalRegistrations > 0
                  ? Math.round((count / overview.totalRegistrations) * 100)
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
                      <span className="text-slate-500">{count} ({percentage}%)</span>
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
              {Object.keys(overview.statusDistribution).length === 0 && (
                <p className="text-slate-500 text-center py-4">No registration data available.</p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ===== BY CHURCH TAB ===== */}
        <TabsContent value="churches" className="space-y-4">
          {sectionIsLoading("churches") ? <LoadingSkeleton /> : (
          <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {byChurch.length} churches &middot; Click a row to see member breakdown
            </p>
            <CsvExport
              data={byChurch.flatMap((c) =>
                c.members.length > 0
                  ? c.members.map((m) => ({
                      Church: c.churchName,
                      Member: m.memberName,
                      "Invite Code": m.inviteCode,
                      Scans: m.scans,
                      Registrations: m.registrations,
                      "Conv %": m.conversionRate,
                    }))
                  : [{ Church: c.churchName, Member: "—", "Invite Code": "—", Scans: c.scans, Registrations: c.registrations, "Conv %": c.conversionRate }]
              )}
              filename={`church-analytics-${eventId}.csv`}
              label="Export Churches"
            />
          </div>
          <Card className="bg-white">
            <div className="p-4">
              <SortableTable
                data={byChurch.map((c) => ({ ...c, id: c.churchId }))}
                columns={churchColumns}
                searchPlaceholder="Search churches..."
                searchKeys={["churchName"]}
                onRowClick={(row) =>
                  setExpandedChurchId(
                    expandedChurchId === row.churchId ? null : row.churchId
                  )
                }
                expandedId={expandedChurchId}
                expandedRow={(row) => (
                  <div className="px-8 py-4 border-t bg-slate-50/50">
                    <h4 className="text-sm font-semibold text-slate-600 mb-3">
                      Members of {row.churchName}
                    </h4>
                    {row.members.length === 0 ? (
                      <p className="text-sm text-slate-400">No member invites found.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium text-slate-500">Member</th>
                            <th className="text-left py-2 px-3 font-medium text-slate-500">Invite Code</th>
                            <th className="text-right py-2 px-3 font-medium text-slate-500">Scans</th>
                            <th className="text-right py-2 px-3 font-medium text-slate-500">Registrations</th>
                            <th className="text-right py-2 px-3 font-medium text-slate-500">Conv %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.members.map((m) => (
                            <tr key={m.memberId} className="border-b last:border-0 hover:bg-slate-50">
                              <td className="py-2 px-3">{m.memberName}</td>
                              <td className="py-2 px-3 font-mono text-xs">{m.inviteCode}</td>
                              <td className="py-2 px-3 text-right">{m.scans}</td>
                              <td className="py-2 px-3 text-right">{m.registrations}</td>
                              <td className="py-2 px-3 text-right">{m.conversionRate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                emptyMessage="No church data available"
              />
            </div>
          </Card>
          </>
          )}
        </TabsContent>

        {/* ===== BY PLACEMENT TAB ===== */}
        <TabsContent value="placements" className="space-y-4">
          {sectionIsLoading("placements") ? <LoadingSkeleton /> : (
          <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {byPlacement.length} ad placements (billboard, bus, flyer, etc.)
            </p>
            <CsvExport data={placementCsvData} filename={`placement-analytics-${eventId}.csv`} label="Export Placements" />
          </div>
          <Card className="bg-white">
            <div className="p-4">
              <SortableTable
                data={byPlacement.map((p) => ({ ...p, id: p.placementId }))}
                columns={placementColumns}
                searchPlaceholder="Search placements..."
                searchKeys={["placementName"]}
                emptyMessage="No placement data available"
              />
            </div>
          </Card>
          </>
          )}
        </TabsContent>

        {/* ===== BY PLATFORM TAB ===== */}
        <TabsContent value="platforms" className="space-y-4">
          {sectionIsLoading("platforms") ? <LoadingSkeleton /> : (
          <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {byPlatform.length} online platforms (Meta, TikTok, YouTube, etc.)
            </p>
            <CsvExport data={platformCsvData} filename={`platform-analytics-${eventId}.csv`} label="Export Platforms" />
          </div>
          <Card className="bg-white">
            <div className="p-4">
              <SortableTable
                data={byPlatform.map((p) => ({ ...p, id: p.platformId }))}
                columns={platformColumns}
                searchPlaceholder="Search platforms..."
                searchKeys={["platformName"]}
                emptyMessage="No platform data available"
              />
            </div>
          </Card>
          </>
          )}
        </TabsContent>

        {/* ===== TECHNICAL TAB ===== */}
        <TabsContent value="technical" className="space-y-6">
          {sectionIsLoading("technical") ? <LoadingSkeleton /> : (
          <>
          {/* Device / Browser / OS Breakdown */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> Device Breakdown
              </h3>
              <BreakdownBars
                items={deviceBreakdown.map((d) => ({ ...d, device: d.name }))}
                labelKey="device"
              />
            </Card>
            <Card className="bg-white p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Browser Breakdown
              </h3>
              <BreakdownBars
                items={browserBreakdown.map((d) => ({ ...d, browser: d.name }))}
                labelKey="browser"
              />
            </Card>
            <Card className="bg-white p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> OS Breakdown
              </h3>
              <BreakdownBars
                items={osBreakdown.map((d) => ({ ...d, os: d.name }))}
                labelKey="os"
              />
            </Card>
          </div>

          {/* Location Demographics */}
          <Card className="bg-white p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location Demographics
            </h3>
            {locationBreakdown.length === 0 ? (
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
                    {locationBreakdown.map((loc, i) => (
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

          {/* Behavioral Metrics */}
          <Card className="bg-white p-6">
            <h3 className="font-semibold mb-4">Behavioral Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">
                  {behavioralMetrics.avgTimeOnPage !== null
                    ? `${behavioralMetrics.avgTimeOnPage}s`
                    : "—"}
                </p>
                <p className="text-xs text-slate-500">Avg Time on Page</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {behavioralMetrics.avgScrollDepth !== null
                    ? `${behavioralMetrics.avgScrollDepth}%`
                    : "—"}
                </p>
                <p className="text-xs text-slate-500">Avg Scroll Depth</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {behavioralMetrics.avgFormStartDelay !== null
                    ? `${behavioralMetrics.avgFormStartDelay}s`
                    : "—"}
                </p>
                <p className="text-xs text-slate-500">Avg Form Start</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{behavioralMetrics.rageClickCount}</p>
                <p className="text-xs text-slate-500">Rage Clicks</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{behavioralMetrics.adBlockerDetectedCount}</p>
                <p className="text-xs text-slate-500">Ad Blockers</p>
              </div>
            </div>
            {behavioralMetrics.sampleSize > 0 && (
              <p className="text-xs text-slate-400 mt-3 text-center">
                Based on {behavioralMetrics.sampleSize} registered user interactions
              </p>
            )}
          </Card>
          </>
          )}
        </TabsContent>
      </Tabs>

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
            <Link href={`/admin/events/${eventId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Event
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
