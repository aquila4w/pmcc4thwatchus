"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Loader2,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronDown,
  Phone,
  Mail,
  Church,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ROLES = [
  { value: "member", label: "Member" },
  { value: "secretary", label: "Secretary" },
  { value: "headMinister", label: "Head Minister" },
  { value: "eventAdmin", label: "Event Admin" },
  { value: "subDistrictCoordinator", label: "Sub-District Coordinator" },
  { value: "districtCoordinator", label: "District Coordinator" },
  { value: "superAdmin", label: "Super Admin" },
];

const STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800" },
  { value: "suspended", label: "Suspended", color: "bg-red-100 text-red-800" },
];

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  church?: { id: string; name: string } | null;
  subDistrict?: { id: string; name: string } | null;
  authProvider?: string | null;
  createdAt: string;
}

interface ChurchOption {
  id: string;
  name: string;
  city?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [churches, setChurches] = useState<ChurchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // Edit dialog
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    user: UserRecord | null;
    role: string;
    status: string;
    church: string;
  }>({ open: false, user: null, role: "", status: "", church: "" });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: UserRecord | null;
  }>({ open: false, user: null });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (filterRole) params.set("role", filterRole);
      if (filterStatus) params.set("status", filterStatus);
      params.set("limit", "100");

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.docs || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    async function fetchChurches() {
      try {
        const res = await fetch("/api/churches");
        if (res.ok) {
          const data = await res.json();
          setChurches(data.docs || []);
        }
      } catch {
        // ignore
      }
    }
    fetchChurches();
  }, []);

  const handleUpdateUser = async () => {
    if (!editDialog.user) return;
    setUpdatingUser(editDialog.user.id);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editDialog.user.id,
          role: editDialog.role,
          status: editDialog.status,
          church: editDialog.church || undefined,
        }),
      });

      if (res.ok) {
        setEditDialog({ open: false, user: null, role: "", status: "", church: "" });
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;
    setUpdatingUser(deleteDialog.user.id);

    try {
      const res = await fetch(`/api/admin/users?id=${deleteDialog.user.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleteDialog({ open: false, user: null });
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setUpdatingUser(null);
    }
  };

  const openEditDialog = (user: UserRecord) => {
    setEditDialog({
      open: true,
      user,
      role: user.role,
      status: user.status,
      church: user.church?.id || "",
    });
  };

  const quickApprove = async (user: UserRecord) => {
    setUpdatingUser(user.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status: "approved" }),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error("Failed to approve user:", error);
    } finally {
      setUpdatingUser(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      superAdmin: "bg-purple-100 text-purple-800",
      districtCoordinator: "bg-indigo-100 text-indigo-800",
      subDistrictCoordinator: "bg-blue-100 text-blue-800",
      eventAdmin: "bg-cyan-100 text-cyan-800",
      headMinister: "bg-emerald-100 text-emerald-800",
      secretary: "bg-teal-100 text-teal-800",
      member: "bg-slate-100 text-slate-700",
      guest: "bg-gray-100 text-gray-600",
    };
    const labels: Record<string, string> = {
      superAdmin: "Super Admin",
      districtCoordinator: "District Coord.",
      subDistrictCoordinator: "Sub-District Coord.",
      eventAdmin: "Event Admin",
      headMinister: "Head Minister",
      secretary: "Secretary",
      member: "Member",
      guest: "Guest",
    };
    return (
      <Badge variant="secondary" className={colors[role] || "bg-slate-100 text-slate-700"}>
        {labels[role] || role}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="secondary" className={config?.color || "bg-slate-100 text-slate-700"}>
        {config?.label || status}
      </Badge>
    );
  };

  // Stats
  const pendingCount = users.filter((u) => u.status === "pending").length;
  const approvedCount = users.filter((u) => u.status === "approved").length;
  const memberCount = users.filter((u) => u.role === "member").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 mt-1">Manage members, roles, and approvals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-slate-500">Total Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-slate-500">Pending Approval</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-sm text-slate-500">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{memberCount}</p>
              <p className="text-sm text-slate-500">Members</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 pl-10 text-sm"
              >
                <option value="">All Roles</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 pl-10 text-sm"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Contact</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Church</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Provider</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                    <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Church className="w-3 h-3 shrink-0" />
                        <span>{user.church?.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.authProvider ? (
                        <Badge variant="outline" className="text-xs capitalize">
                          {user.authProvider}
                        </Badge>
                      ) : (
                        <span className="text-sm text-slate-400">Email</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {user.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => quickApprove(user)}
                            disabled={updatingUser === user.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            {updatingUser === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          disabled={updatingUser === user.id}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, user })}
                          disabled={updatingUser === user.id}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editDialog.user && (
            <div className="space-y-4 py-4">
              <div>
                <p className="font-medium">{editDialog.user.name}</p>
                <p className="text-sm text-slate-500">{editDialog.user.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={editDialog.role}
                  onChange={(e) => setEditDialog((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                  <option value="guest">Guest</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={editDialog.status}
                  onChange={(e) => setEditDialog((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Church</label>
                <select
                  value={editDialog.church}
                  onChange={(e) => setEditDialog((prev) => ({ ...prev, church: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">No church assigned</option>
                  {churches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.city ? ` - ${c.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, user: null, role: "", status: "", church: "" })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={!!updatingUser}>
              {updatingUser ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          {deleteDialog.user && (
            <div className="py-4">
              <p className="text-slate-600">
                Are you sure you want to delete <strong>{deleteDialog.user.name}</strong>?
                This action cannot be undone.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={!!updatingUser}>
              {updatingUser ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
