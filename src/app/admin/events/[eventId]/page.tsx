"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  QrCode,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  UserCheck,
  FileSpreadsheet,
  Mail,
  Loader2,
  CheckCircle,
  X,
  Plus,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventStatusBadge } from "@/components/admin/events/EventStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location: string;
  address?: string;
  status: string;
  eventType?: string;
  registrationCount?: number;
  maxAttendees?: number;
  registrationEnabled?: boolean;
  registrationDeadline?: string;
  hasBaptism?: boolean;
  requireApproval?: boolean;
}

interface EventStats {
  totalRegistrations?: number;
  attendedCount?: number;
  baptizedCount?: number;
  spotsRemaining?: number;
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch event details
      const eventRes = await fetch(`/api/managed-events/${eventId}`);
      if (!eventRes.ok) {
        router.push("/admin/events");
        return;
      }
      const eventData = await eventRes.json();
      setEvent(eventData);

      // Fetch stats
      const statsRes = await fetch(`/api/events/${eventId}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Failed to fetch event:", error);
      router.push("/admin/events");
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/managed-events/${eventId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/events");
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    } finally {
      setDeleting(false);
    }
  };

  const copyRegistrationLink = () => {
    const url = `${window.location.origin}/register/${event?.slug}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
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

  if (!event) {
    return (
      <Card className="bg-white p-12 text-center">
        <p className="text-slate-500">Event not found</p>
      </Card>
    );
  }

  const spotsRemaining = stats.spotsRemaining !== undefined
    ? stats.spotsRemaining
    : event.maxAttendees && event.registrationCount !== undefined
      ? event.maxAttendees - event.registrationCount
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-slate-500">{event.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/admin/events/${event.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyRegistrationLink}>
                <Copy className="w-4 h-4 mr-2" />
                {copySuccess ? "Copied!" : "Copy Registration Link"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/admin/events/${event.id}/invites`)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Manage Invites
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/admin/events/${event.id}/church-codes`)}
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Church QR Codes
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? "Deleting..." : "Delete Event"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        <EventStatusBadge status={event.status} />
        {event.eventType && (
          <Badge variant="outline" className="capitalize">
            {event.eventType}
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalRegistrations || 0}</p>
              <p className="text-xs text-slate-500">Total Registrations</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.attendedCount || 0}</p>
              <p className="text-xs text-slate-500">Attended</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.baptizedCount || 0}</p>
              <p className="text-xs text-slate-500">Baptized</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {spotsRemaining !== null ? spotsRemaining : "-"}
              </p>
              <p className="text-xs text-slate-500">Spots Remaining</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {event.maxAttendees || "Unlimited"}
              </p>
              <p className="text-xs text-slate-500">Max Capacity</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Link href={`/admin/events/${eventId}/registrations`}>
          <Card className="bg-white p-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <Users className="w-5 h-5 text-slate-600 mb-2" />
            <p className="font-medium">Registrations</p>
            <p className="text-xs text-slate-500">Manage attendees</p>
          </Card>
        </Link>

        <Link href={`/admin/events/${eventId}/check-in`}>
          <Card className="bg-white p-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <QrCode className="w-5 h-5 text-slate-600 mb-2" />
            <p className="font-medium">Check-In</p>
            <p className="text-xs text-slate-500">QR scanner & check-in</p>
          </Card>
        </Link>

        <Link href={`/event/${eventId}/baptism`}>
          <Card className="bg-white p-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <Sparkles className="w-5 h-5 text-purple-600 mb-2" />
            <p className="font-medium">Baptism</p>
            <p className="text-xs text-slate-500">Record baptisms</p>
          </Card>
        </Link>

        <Link href={`/admin/events/${eventId}/analytics`}>
          <Card className="bg-white p-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <BarChart3 className="w-5 h-5 text-slate-600 mb-2" />
            <p className="font-medium">Analytics</p>
            <p className="text-xs text-slate-500">Stats & insights</p>
          </Card>
        </Link>

        <Link href={`/admin/campaigns/new?eventId=${eventId}`}>
          <Card className="bg-white p-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <Mail className="w-5 h-5 text-slate-600 mb-2" />
            <p className="font-medium">Create Campaign</p>
            <p className="text-xs text-slate-500">Send reminders</p>
          </Card>
        </Link>

        <Link href={`/admin/events/${eventId}/edit`}>
          <Card className="bg-white p-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <Edit className="w-5 h-5 text-slate-600 mb-2" />
            <p className="font-medium">Edit Event</p>
            <p className="text-xs text-slate-500">Update details</p>
          </Card>
        </Link>

        <Link href={`/admin/events/${eventId}/church-codes`}>
          <Card className="bg-white p-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <Megaphone className="w-5 h-5 text-slate-600 mb-2" />
            <p className="font-medium">Church QR Codes</p>
            <p className="text-xs text-slate-500">Ad invite codes</p>
          </Card>
        </Link>
      </div>

      {/* Event Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Date & Time */}
        <Card className="bg-white p-6">
          <h3 className="font-semibold mb-4">Date & Time</h3>
          <div className="space-y-3">
            {event.startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm">{formatDate(event.startDate)} at {formatTime(event.startDate)}</span>
              </div>
            )}
            {event.endDate && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm">
                  {formatDate(event.endDate)} at {formatTime(event.endDate)}
                </span>
              </div>
            )}
            {event.registrationDeadline && (
              <div className="flex items-center gap-2 text-slate-500">
                <span className="text-xs">Registration deadline: {formatDate(event.registrationDeadline)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Location */}
        <Card className="bg-white p-6">
          <h3 className="font-semibold mb-4">Location</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium">{event.location}</span>
            </div>
            {event.address && (
              <p className="text-sm text-slate-600">{event.address}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Description */}
      {event.description && (
        <Card className="bg-white p-6">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{event.description}</p>
        </Card>
      )}

      {/* Registration Settings */}
      <Card className="bg-white p-6">
        <h3 className="font-semibold mb-4">Registration Settings</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Registration:</span>
            <Badge variant={event.registrationEnabled ? "default" : "secondary"}>
              {event.registrationEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Max Attendees:</span>
            <span>{event.maxAttendees || "Unlimited"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Baptism Included:</span>
            <Badge variant={event.hasBaptism ? "default" : "secondary"}>
              {event.hasBaptism ? "Yes" : "No"}
            </Badge>
          </div>
          {event.requireApproval && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">Approval Required</Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Copy Registration Link */}
      <Card className="bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Registration Link</h3>
            <p className="text-sm text-slate-500">
              {window.location.origin}/register/{event.slug}
            </p>
          </div>
          <Button onClick={copyRegistrationLink} variant={copySuccess ? "secondary" : "default"}>
            <Copy className="w-4 h-4 mr-2" />
            {copySuccess ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
