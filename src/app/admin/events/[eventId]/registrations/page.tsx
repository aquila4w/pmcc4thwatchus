"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  UserCheck,
  Clock,
  Loader2,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RegistrationTable } from "@/components/admin/events/RegistrationTable";

interface Registration {
  id: string;
  inviteCode: string;
  guestInfo: {
    name?: string;
    email?: string;
    phone?: string;
  };
  invitedByChurch?: {
    id: string;
    name: string;
  };
  status: string;
  registeredAt?: string;
  attendedAt?: string;
  baptizedAt?: string;
}

interface StatsResponse {
  totalRegistrations?: number;
  attendedCount?: number;
  baptizedCount?: number;
  waitlistedCount?: number;
}

export default function EventRegistrationsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<StatsResponse>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<{ status?: string; search?: string }>({});

  const fetchRegistrations = useCallback(async (filters?: { status?: string; search?: string }, pageNum = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        limit: "50",
        page: String(pageNum),
      });

      if (filters?.status) {
        queryParams.append("status", filters.status);
      }
      if (filters?.search) {
        queryParams.append("search", filters.search);
      }

      const res = await fetch(`/api/managed-events/${eventId}/registrations?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.docs || []);
        setTotalPages(data.totalPages || 1);
        setTotalDocs(data.totalDocs || 0);
        setPage(data.page || 1);
      }
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, [eventId]);

  useEffect(() => {
    fetchRegistrations();
    fetchStats();
  }, [fetchRegistrations, fetchStats]);

  const handleFilterChange = (filters: { status?: string; search?: string }) => {
    setCurrentFilters(filters);
    fetchRegistrations(filters, 1);
  };

  const handlePageChange = (newPage: number) => {
    fetchRegistrations(currentFilters, newPage);
  };

  const handleRefresh = () => {
    fetchRegistrations(currentFilters, page);
    fetchStats();
  };

  if (loading && registrations.length === 0) {
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/events/${eventId}`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Registrations</h1>
            <p className="text-slate-500">Manage event attendees</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/events/${eventId}`}>
              Back to Event
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className="text-2xl font-bold">{stats.waitlistedCount || 0}</p>
              <p className="text-xs text-slate-500">Waitlisted</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button variant="outline">
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Registration Table */}
      <Card className="bg-white p-6">
        <RegistrationTable
          eventId={eventId}
          registrations={registrations}
          totalDocs={totalDocs}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
          onRefresh={handleRefresh}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </Card>
    </div>
  );
}
