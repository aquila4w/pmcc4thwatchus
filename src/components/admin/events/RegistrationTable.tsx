"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  UserCheck,
  XCircle,
  Download,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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

interface RegistrationTableProps {
  eventId: string;
  registrations: Registration[];
  totalDocs: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: { status?: string; search?: string }) => void;
  onRefresh: () => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  registered: { label: "Registered", color: "bg-blue-100 text-blue-700", icon: Clock },
  attended: { label: "Attended", color: "bg-green-100 text-green-700", icon: CheckCircle },
  baptized: { label: "Baptized", color: "bg-purple-100 text-purple-700", icon: UserCheck },
  waitlisted: { label: "Waitlisted", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

export function RegistrationTable({
  eventId,
  registrations,
  totalDocs,
  page,
  totalPages,
  onPageChange,
  onFilterChange,
  onRefresh,
  selectedIds,
  onSelectionChange,
}: RegistrationTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFilterChange({ status: statusFilter, search: value || undefined });
  };

  const handleStatusFilter = (status: string) => {
    const newStatus = statusFilter === status ? "" : status;
    setStatusFilter(newStatus);
    onFilterChange({ status: newStatus || undefined, search: searchTerm || undefined });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === registrations.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(registrations.map((r) => r.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const updateRegistrationStatus = async (registrationId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/managed-events/${eventId}/registrations/${registrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const deleteRegistration = async (registrationId: string) => {
    if (!confirm("Are you sure you want to delete this registration?")) return;

    try {
      const res = await fetch(`/api/managed-events/${eventId}/registrations/${registrationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to delete registration:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, phone, or invite code..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(statusConfig).map(([key, { label }]) => (
            <Button
              key={key}
              variant={statusFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Selection Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-700">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Export Selected
            </Button>
            <Button size="sm" variant="destructive">
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="w-12 p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === registrations.length && registrations.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="text-left p-4 font-medium text-sm">Guest</th>
                <th className="text-left p-4 font-medium text-sm">Church</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Registered</th>
                <th className="text-left p-4 font-medium text-sm">Attended</th>
                <th className="text-left p-4 font-medium text-sm">Invite Code</th>
                <th className="w-12 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => {
                const statusInfo = statusConfig[registration.status] || statusConfig.registered;
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={registration.id} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(registration.id)}
                        onChange={() => handleSelectOne(registration.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/admin/registrations/${registration.id}`}
                          className="font-medium hover:underline"
                        >
                          {registration.guestInfo?.name || "Unknown"}
                        </Link>
                        <div className="text-sm text-slate-500">
                          {registration.guestInfo?.email || registration.guestInfo?.phone || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {registration.invitedByChurch?.name || "-"}
                    </td>
                    <td className="p-4">
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm">
                      <div>{formatDate(registration.registeredAt)}</div>
                      <div className="text-slate-500">{formatTime(registration.registeredAt)}</div>
                    </td>
                    <td className="p-4 text-sm">
                      {registration.attendedAt ? (
                        <div>
                          <div>{formatDate(registration.attendedAt)}</div>
                          <div className="text-slate-500">{formatTime(registration.attendedAt)}</div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-4 text-sm font-mono text-slate-500">
                      {registration.inviteCode.slice(0, 8)}...
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => updateRegistrationStatus(registration.id, "attended")}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Attended
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateRegistrationStatus(registration.id, "baptized")}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Mark as Baptized
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteRegistration(registration.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    No registrations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-slate-500">
              Showing {registrations.length} of {totalDocs} registrations
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center px-3 text-sm">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
