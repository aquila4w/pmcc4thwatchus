"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

export default function EventAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [stats, setStats] = useState<EventStats>({});
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [event, setEvent] = useState<{
    title?: string;
    startDate?: string;
    location?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch(`/api/events/${eventId}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch registrations for church breakdown
      const regsRes = await fetch(`/api/managed-events/${eventId}/registrations?limit=999`);
      if (regsRes.ok) {
        const regsData = await regsRes.json();
        setRegistrations(regsData.docs || []);
      }

      // Fetch event details
      const eventRes = await fetch(`/api/managed-events/${eventId}`);
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData);
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

  // Calculate church breakdown
  const churchBreakdown = registrations.reduce((acc, reg) => {
    const churchName = reg.invitedByChurch?.name || "Unknown";
    acc[churchName] = (acc[churchName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate attendance rate
  const attendanceRate =
    stats.totalRegistrations && stats.totalRegistrations > 0
      ? Math.round(((stats.attendedCount || 0) / stats.totalRegistrations) * 100)
      : 0;

  // Calculate baptism rate
  const baptismRate =
    stats.attendedCount && stats.attendedCount > 0
      ? Math.round(((stats.baptizedCount || 0) / stats.attendedCount) * 100)
      : 0;

  // Status distribution
  const statusDistribution = registrations.reduce((acc, reg) => {
    acc[reg.status] = (acc[reg.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Distribution */}
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
            {Object.keys(statusDistribution).length === 0 && (
              <p className="text-slate-500 text-center py-4">No data available</p>
            )}
          </div>
        </Card>

        {/* Church Breakdown */}
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
                      <span className="text-slate-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
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
                  ? new Date(event.startDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
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
    </div>
  );
}
