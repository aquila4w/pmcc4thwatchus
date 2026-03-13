"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Church,
  UserPlus,
  TrendingUp,
  ArrowRight,
  Loader2,
  Mail,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  upcomingEvents: number;
  totalGuests: number;
  totalChurches: number;
  eligibleGuests: number;
  recentRegistrations: number;
  openCampaigns: number;
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  status: string;
  registrationCount?: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch upcoming events
      const eventsRes = await fetch("/payload-api/managed-events?where=status[equals]=registration-open&limit=5&sort=startDate&depth=0");
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setUpcomingEvents(eventsData.docs || []);
      }

      // Fetch churches count
      const churchesRes = await fetch("/payload-api/churches?limit=1");
      if (churchesRes.ok) {
        const churchesData = await churchesRes.json();
        const totalChurches = churchesData.totalDocs || 0;

        // Fetch eligible guests
        const guestsRes = await fetch("/api/guests/eligible");
        const eligibleGuests = guestsRes.ok ? (await guestsRes.json()).guests?.length || 0 : 0;

        // Calculate stats
        setStats({
          upcomingEvents: upcomingEvents.length,
          totalGuests: eligibleGuests,
          totalChurches,
          eligibleGuests: eligibleGuests,
          recentRegistrations: 0, // Would need separate API
          openCampaigns: 0, // Would need separate API
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingEvents.length}</p>
              <p className="text-sm text-slate-500">Active Events</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.eligibleGuests || 0}</p>
              <p className="text-sm text-slate-500">Eligible Guests</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Church className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalChurches || 0}</p>
              <p className="text-sm text-slate-500">Churches</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Mail className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.openCampaigns || 0}</p>
              <p className="text-sm text-slate-500">Active Campaigns</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white p-6 hover:shadow-md transition-shadow">
            <Link href="/admin/events" className="block">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Manage Events</h3>
                  <p className="text-sm text-slate-500">View and manage events</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </Link>
          </Card>

          <Card className="bg-white p-6 hover:shadow-md transition-shadow">
            <Link href="/admin/guests" className="block">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Guest Management</h3>
                  <p className="text-sm text-slate-500">Promote guests to members</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </Link>
          </Card>

          <Card className="bg-white p-6 hover:shadow-md transition-shadow">
            <Link href="/admin/campaigns" className="block">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Campaigns</h3>
                  <p className="text-sm text-slate-500">Send email and SMS campaigns</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </Link>
          </Card>
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/events">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.slice(0, 6).map((event) => (
              <Card key={event.id} className="bg-white p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold line-clamp-2">{event.title}</h3>
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Open
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event.startDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                  <Users className="w-4 h-4" />
                  <span>{event.registrationCount || 0} registered</span>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/admin/events/${event.id}/invites`}>
                    Manage Invites
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {upcomingEvents.length === 0 && (
        <Card className="bg-white p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            No upcoming events
          </h3>
          <p className="text-slate-500 mb-4">
            Create an event to get started with invite links and guest registration
          </p>
          <Button asChild>
            <Link href="/cms/collections/managed-events/create">
              <Calendar className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
