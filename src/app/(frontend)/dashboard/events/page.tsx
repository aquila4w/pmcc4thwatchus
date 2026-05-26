"use client";

import { useState } from "react";
import Link from "next/link";
import { formatEventDate } from "@/lib/event-date";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  QrCode,
  Users,
  Mail,
  ChevronLeft,
  MapPin,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const events = [
  {
    id: "evt-001",
    title: "Spiritual Empowerment Day 1",
    slug: "spiritual-empowerment-day-1",
    startDate: "2026-03-15T09:00:00",
    endDate: "2026-03-15T17:00:00",
    location: "Los Angeles Convention Center",
    status: "published",
    requiresRegistration: true,
    hasBaptism: true,
    registrations: 156,
    attended: 0,
    organizer: "LA Central Church",
  },
  {
    id: "evt-002",
    title: "Apostolic Worship & Faith",
    slug: "apostolic-worship-faith",
    startDate: "2026-03-16T10:00:00",
    endDate: "2026-03-16T16:00:00",
    location: "San Francisco Civic Center",
    status: "published",
    requiresRegistration: true,
    hasBaptism: false,
    registrations: 89,
    attended: 0,
    organizer: "SF Bay Church",
  },
  {
    id: "evt-003",
    title: "Apostolic Soul Winning",
    slug: "apostolic-soul-winning",
    startDate: "2026-03-17T09:00:00",
    endDate: "2026-03-17T18:00:00",
    location: "San Diego Convention Center",
    status: "draft",
    requiresRegistration: true,
    hasBaptism: true,
    registrations: 0,
    attended: 0,
    organizer: "SD South Church",
  },
  {
    id: "evt-004",
    title: "Youth Fellowship Night",
    slug: "youth-fellowship-night",
    startDate: "2026-03-20T18:00:00",
    endDate: "2026-03-20T21:00:00",
    location: "Sacramento Community Hall",
    status: "published",
    requiresRegistration: false,
    hasBaptism: false,
    registrations: 0,
    attended: 0,
    organizer: "Sacramento Church",
  },
];

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Events</h1>
              <p className="text-sm text-muted-foreground">Manage church events and registrations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search events..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button asChild>
              <Link href="/dashboard/events/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Link>
            </Button>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Event Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant={event.status === "published" ? "default" : "secondary"}>
                          {event.status}
                        </Badge>
                        {event.hasBaptism && (
                          <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                            Baptism
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatEventDate(event.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                {event.requiresRegistration && (
                  <div className="flex gap-6 lg:gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{event.registrations}</p>
                      <p className="text-xs text-muted-foreground">Registered</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{event.attended}</p>
                      <p className="text-xs text-muted-foreground">Attended</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {event.requiresRegistration && (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/events/${event.id}/registrations`}>
                          <Users className="w-4 h-4 mr-1" />
                          Registrations
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/events/${event.id}/check-in`}>
                          <QrCode className="w-4 h-4 mr-1" />
                          Check-in
                        </Link>
                      </Button>
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/events/${event.slug}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/events/${event.id}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/events/${event.id}/campaigns`}>
                          <Mail className="w-4 h-4 mr-2" />
                          Campaigns
                        </Link>
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
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">Create your first event to get started</p>
            <Button asChild>
              <Link href="/dashboard/events/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
