"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  UserCheck,
  XCircle,
  Trash2,
  Users,
  FilterX,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Share2,
  Footprints,
  UserPlus,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  sourceType?: string;
  sourceLabel?: string;
  invitedByName?: string | null;
  guestUserId?: string | null;
  referralSource?: string;
  referralSourceOther?: string;
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
  loading?: boolean;
  statusCounts?: Record<string, number>;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: { statuses: string[]; search?: string }) => void;
  onRefresh: () => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  invited: { label: "Invited", color: "bg-slate-100 text-slate-700", icon: Clock },
  registered: { label: "Registered", color: "bg-blue-100 text-blue-700", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-cyan-100 text-cyan-700", icon: CheckCircle },
  attended: { label: "Attended", color: "bg-green-100 text-green-700", icon: CheckCircle },
  baptized: { label: "Baptized", color: "bg-purple-100 text-purple-700", icon: UserCheck },
  waitlisted: { label: "Waitlisted", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

// Presets: exact sets of statuses that match a semantic meaning
const PRESETS = [
  {
    key: "allRegistered",
    label: "All Registered",
    icon: Users,
    statuses: ["registered", "confirmed", "attended", "baptized"],
  },
  {
    key: "notCheckedIn",
    label: "Not Checked In",
    icon: Clock,
    statuses: ["registered", "confirmed"],
  },
];

// Individual filter pills (shown in the status row)
const FILTER_STATUSES = ["registered", "confirmed", "attended", "baptized", "waitlisted", "cancelled"];

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

export function RegistrationTable({
  eventId,
  registrations,
  totalDocs,
  page,
  totalPages,
  loading = false,
  statusCounts = {},
  onPageChange,
  onFilterChange,
  onRefresh,
  selectedIds,
  onSelectionChange,
}: RegistrationTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Convert to Member dialog state
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertTarget, setConvertTarget] = useState<Registration | null>(null);
  const [churches, setChurches] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedChurch, setSelectedChurch] = useState("");
  const [converting, setConverting] = useState(false);

  // Compute which preset is active (matches exact set)
  const activePreset = PRESETS.find((p) => arraysEqual(p.statuses, activeStatuses))?.key || null;

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      onFilterChange({ statuses: activeStatuses, search: value || undefined });
    }, 300);
  }, [activeStatuses, onFilterChange]);

  // Toggle an individual status pill
  const handleStatusToggle = (status: string) => {
    const next = activeStatuses.includes(status)
      ? activeStatuses.filter((s) => s !== status)
      : [...activeStatuses, status];
    setActiveStatuses(next);
    onFilterChange({ statuses: next, search: searchTerm || undefined });
  };

  // Click a preset
  const handlePresetClick = (presetStatuses: string[]) => {
    // If clicking the already-active preset, deselect (go to "All")
    if (arraysEqual(presetStatuses, activeStatuses)) {
      setActiveStatuses([]);
      onFilterChange({ statuses: [], search: searchTerm || undefined });
    } else {
      setActiveStatuses(presetStatuses);
      onFilterChange({ statuses: presetStatuses, search: searchTerm || undefined });
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setActiveStatuses([]);
    setSearchTerm("");
    onFilterChange({ statuses: [], search: undefined });
  };

  const hasActiveFilters = activeStatuses.length > 0 || searchTerm.length > 0;

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

  const openConvertDialog = async (registration: Registration) => {
    setConvertTarget(registration);
    setSelectedChurch("");
    setConvertDialogOpen(true);
    try {
      const res = await fetch("/api/churches");
      if (res.ok) {
        const data = await res.json();
        setChurches(data.docs || []);
      }
    } catch (error) {
      console.error("Failed to fetch churches:", error);
    }
  };

  const handleConvertToMember = async () => {
    if (!convertTarget || !selectedChurch) return;
    setConverting(true);
    try {
      const res = await fetch(
        `/api/managed-events/${eventId}/registrations/${convertTarget.id}/convert-to-member`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ churchId: selectedChurch }),
        }
      );
      if (res.ok) {
        setConvertDialogOpen(false);
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to convert to member");
      }
    } catch (error) {
      console.error("Failed to convert to member:", error);
      alert("Failed to convert to member");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search + Filter Pills */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, phone, or invite code..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-slate-500">
              <FilterX className="w-4 h-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Preset pills */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* "All" pill */}
          <Button
            variant={activeStatuses.length === 0 ? "default" : "outline"}
            size="sm"
            onClick={handleClearFilters}
            className="gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            All
            <span className="text-xs opacity-70">({totalDocs})</span>
          </Button>

          <span className="text-slate-300 mx-1">|</span>

          {PRESETS.map((preset) => {
            const PresetIcon = preset.icon;
            const isActive = activePreset === preset.key;
            return (
              <Button
                key={preset.key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetClick(preset.statuses)}
                className="gap-1.5"
              >
                <PresetIcon className="w-3.5 h-3.5" />
                {preset.label}
                <span className="text-xs opacity-70">
                  ({preset.statuses.reduce((sum, s) => sum + (statusCounts[s] || 0), 0)})
                </span>
              </Button>
            );
          })}

          <span className="text-slate-300 mx-1">|</span>

          {/* Individual status pills (multi-select toggle) */}
          {FILTER_STATUSES.map((status) => {
            const config = statusConfig[status];
            const isActive = activeStatuses.includes(status);
            const count = statusCounts[status] || 0;
            return (
              <Button
                key={status}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusToggle(status)}
                className="gap-1.5"
              >
                {config.label}
                <span className="text-xs opacity-70">({count})</span>
              </Button>
            );
          })}
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
      <div className="bg-white rounded-lg border overflow-hidden relative">
        {/* Inline loading overlay */}
        {loading && registrations.length > 0 && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

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
                <th className="text-left p-4 font-medium text-sm">Source</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Registered</th>
                <th className="text-left p-4 font-medium text-sm">Attended</th>
                <th className="text-left p-4 font-medium text-sm">Invite Code</th>
                <th className="w-12 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading && registrations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <span className="text-slate-500">Loading registrations...</span>
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    No registrations found
                  </td>
                </tr>
              ) : (
                registrations.map((registration) => {
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
                          <span className="font-medium">
                            {registration.guestInfo?.name || "Unknown"}
                          </span>
                          {registration.guestInfo?.email && (
                            <div className="text-sm text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 shrink-0" />
                              {registration.guestInfo.email}
                            </div>
                          )}
                          {registration.guestInfo?.phone && (
                            <div className="text-sm text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 shrink-0" />
                              {registration.guestInfo.phone}
                            </div>
                          )}
                          {!registration.guestInfo?.email && !registration.guestInfo?.phone && (
                            <div className="text-sm text-slate-400">No contact info</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          {registration.sourceType === "walk-in" ? (
                            <Footprints className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : registration.sourceType === "platform" ? (
                            <Share2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          ) : registration.sourceType === "church" ? (
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          ) : (
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <div>
                            <span>{registration.sourceLabel || registration.invitedByChurch?.name || "-"}</span>
                            {registration.invitedByName && registration.sourceType === "member" && (
                              <div className="text-slate-400 text-xs mt-0.5">
                                by {registration.invitedByName}
                              </div>
                            )}
                            {registration.invitedByName && registration.sourceType === "church" && (
                              <div className="text-slate-400 text-xs mt-0.5">
                                invited by {registration.invitedByName}
                              </div>
                            )}
                          </div>
                        </div>
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
                            <DropdownMenuItem
                              onClick={() => openConvertDialog(registration)}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Convert to Member
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-slate-500">
              Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, totalDocs)} of {totalDocs.toLocaleString()} registrations
            </div>
            <div className="flex gap-1 items-center">
              {/* First page */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(1)}
                disabled={page === 1}
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              {/* Previous */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {/* Page numbers */}
              {(() => {
                const pages: (number | "ellipsis")[] = [];
                const maxVisible = 5;

                if (totalPages <= maxVisible + 2) {
                  // Show all pages
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  // Always show first page
                  pages.push(1);

                  if (page > 3) pages.push("ellipsis");

                  // Pages around current
                  const start = Math.max(2, page - 1);
                  const end = Math.min(totalPages - 1, page + 1);
                  for (let i = start; i <= end; i++) pages.push(i);

                  if (page < totalPages - 2) pages.push("ellipsis");

                  // Always show last page
                  pages.push(totalPages);
                }

                return pages.map((p, idx) =>
                  p === "ellipsis" ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => onPageChange(p)}
                    >
                      {p}
                    </Button>
                  )
                );
              })()}

              {/* Next */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              {/* Last page */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(totalPages)}
                disabled={page === totalPages}
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Convert to Member Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Member</DialogTitle>
            <DialogDescription>
              Convert {convertTarget?.guestInfo?.name || "this guest"} to a member.
              They will receive login credentials and must change
              their password on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign to Church</label>
              <select
                value={selectedChurch}
                onChange={(e) => setSelectedChurch(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select a church...</option>
                {churches.map((church) => (
                  <option key={church.id} value={church.id}>
                    {church.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)} disabled={converting}>
              Cancel
            </Button>
            <Button onClick={handleConvertToMember} disabled={!selectedChurch || converting}>
              {converting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Convert to Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
