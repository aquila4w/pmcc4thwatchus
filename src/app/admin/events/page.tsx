"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatEventDate, formatEventTime } from "@/lib/event-date";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Search,
  Filter,
  QrCode,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EventDialog } from "@/components/admin/events/EventDialog";
import { EventStatusBadge } from "@/components/admin/events/EventStatusBadge";

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
  status: string;
  registrationCount?: number;
  attendeeCount?: number;
  baptizedCount?: number;
}

interface Church {
  id: string;
  name: string;
}

interface SubDistrict {
  id: string;
  name: string;
}

const statusConfig = {
  "draft": "Draft",
  "registration-open": "Registration Open",
  "registration-closed": "Registration Closed",
  "in-progress": "In Progress",
  "completed": "Completed",
  "cancelled": "Cancelled",
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedChurch, setSelectedChurch] = useState<string>("");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get events
      const eventsRes = await fetch("/payload-api/managed-events?limit=999&sort=-startDate&depth=0");
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.docs || []);
      }

      // Get churches for filter
      const churchesRes = await fetch("/payload-api/churches?limit=999&depth=0");
      if (churchesRes.ok) {
        const churchesData = await churchesRes.json();
        setChurches(churchesData.docs || []);
      }

      // Get subdistricts for filter
      const subDistrictsRes = await fetch("/payload-api/sub-districts?limit=999&depth=0");
      if (subDistrictsRes.ok) {
        const subDistrictsData = await subDistrictsRes.json();
        setSubDistricts(subDistrictsData.docs || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || event.status === selectedStatus;
    // TODO: Add church/subdistrict filtering when implemented in events
    return matchesSearch && matchesStatus;
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-slate-500">Manage events and invitations</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Statuses</option>
            {Object.entries(statusConfig).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Events List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
            <Card key={event.id} className="bg-white overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
                  <EventStatusBadge status={event.status} />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatEventDate(event.startDate)}</span>
                  </div>
                  {event.startDate && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>{formatEventTime(event.startDate)}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  {event.registrationCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{event.registrationCount} registered</span>
                    </div>
                  )}
                  {event.attendeeCount !== undefined && event.attendeeCount > 0 && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{event.attendeeCount} attended</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/admin/events/${event.id}`}>
                      <QrCode className="w-4 h-4 mr-1" />
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/admin/events/${event.id}/analytics`}>
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Analytics
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/events/${event.id}/invites`}>
                      Invites
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {filteredEvents.length === 0 && (
        <Card className="bg-white p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            No events found
          </h3>
          <p className="text-slate-500">
            {searchTerm || selectedStatus
              ? "Try adjusting your filters"
              : "Create your first event to get started"}
          </p>
        </Card>
      )}

      <EventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
