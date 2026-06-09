"use client";

import { useState, useEffect, useCallback } from "react";
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
  MapPin,
  BarChart3,
  Globe,
  Megaphone,
  QrCode,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EventData {
  id: string;
  title: string;
  startDate: string;
  status: string;
  registrationCount?: number;
  location?: string;
}

export default function DashboardPage() {
  const [eventCount, setEventCount] = useState(0);
  const [activeEvents, setActiveEvents] = useState<EventData[]>([]);
  const [churchCount, setChurchCount] = useState(0);
  const [guestCount, setGuestCount] = useState(0);
  const [campaignCount, setCampaignCount] = useState(0);
  const [userInviteCode, setUserInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, churchesRes, guestsRes, meRes] = await Promise.all([
        fetch("/payload-api/managed-events?limit=5&sort=-startDate&depth=0"),
        fetch("/payload-api/churches?limit=1"),
        fetch("/api/guests/eligible"),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setActiveEvents(data.docs || []);
        setEventCount(data.totalDocs || 0);
      }

      if (churchesRes.ok) {
        const data = await churchesRes.json();
        setChurchCount(data.totalDocs || 0);
      }

      if (guestsRes.ok) {
        const data = await guestsRes.json();
        setGuestCount(data.guests?.length || 0);
      }

      if (meRes.ok) {
        const data = await meRes.json();
        setUserInviteCode(data.user?.inviteCode || null);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
        <p className="text-slate-500">Overview of your district events and activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{eventCount}</p>
              <p className="text-sm text-slate-500">Events</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{guestCount}</p>
              <p className="text-sm text-slate-500">Guests</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Church className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{churchCount}</p>
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
              <p className="text-2xl font-bold">{campaignCount}</p>
              <p className="text-sm text-slate-500">Campaigns</p>
            </div>
          </div>
        </Card>
      </div>

      {/* My ID QR */}
      {userInviteCode && (
        <Card className="bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg border flex-shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`PMCC4W-${userInviteCode}`)}`}
                alt="My ID QR"
                width={80}
                height={80}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                My ID Card
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Show this QR at any event for identification & attendance
              </p>
              <p className="text-xs text-slate-400 mt-1">ID: {userInviteCode}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`PMCC4W-${userInviteCode}`)}`;
                const link = document.createElement("a");
                link.href = url;
                link.download = `my-id-${userInviteCode}.png`;
                link.click();
              }}
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white p-4 hover:shadow-md transition-shadow">
            <Link href="/admin/events" className="block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Manage Events</h3>
                  <p className="text-xs text-slate-500">View & create events</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>
          </Card>

          <Card className="bg-white p-4 hover:shadow-md transition-shadow">
            <Link href="/admin/guests" className="block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Guests</h3>
                  <p className="text-xs text-slate-500">Manage & promote</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>
          </Card>

          <Card className="bg-white p-4 hover:shadow-md transition-shadow">
            <Link href="/admin/campaigns" className="block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Campaigns</h3>
                  <p className="text-xs text-slate-500">Email & SMS blasts</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>
          </Card>

          <Card className="bg-white p-4 hover:shadow-md transition-shadow">
            <Link href="/admin/platforms" className="block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Platforms</h3>
                  <p className="text-xs text-slate-500">Online channels</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>
          </Card>
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Events</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/events">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
        {activeEvents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeEvents.map((event) => (
              <Card key={event.id} className="bg-white p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold line-clamp-2 text-sm">{event.title}</h3>
                  <Badge className={
                    event.status === "registration-open"
                      ? "bg-green-100 text-green-700"
                      : event.status === "draft"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-blue-100 text-blue-700"
                  }>
                    {event.status === "registration-open" ? "Open" : event.status === "draft" ? "Draft" : event.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span>{event.registrationCount || 0} registered</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                    <Link href={`/admin/events/${event.id}`}>Manage</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                    <Link href={`/admin/events/${event.id}/analytics`}>
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Analytics
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No events yet</h3>
            <p className="text-slate-500 mb-4">Create your first event to get started</p>
            <Button asChild>
              <Link href="/admin/events">
                <Calendar className="w-4 h-4 mr-2" />
                Create Event
              </Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
