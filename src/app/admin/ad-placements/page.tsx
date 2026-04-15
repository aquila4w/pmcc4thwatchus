"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Megaphone,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface AdPlacement {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: "active" | "disabled";
}

export default function AdPlacementsPage() {
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", status: "active" as "active" | "disabled" });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ad-placements");
      if (res.ok) {
        const data = await res.json();
        setPlacements(data.docs || []);
      }
    } catch (err) {
      console.error("Failed to fetch ad placements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = "/api/admin/ad-placements";
      const method = editingId ? "PATCH" : "POST";
      const body = editingId
        ? { id: editingId, name: form.name.trim(), description: form.description.trim(), status: form.status }
        : { name: form.name.trim(), description: form.description.trim() || undefined, status: form.status };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchData();
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } catch (err) {
      console.error("Failed to save ad placement:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad placement?")) return;
    try {
      const res = await fetch(`/api/admin/ad-placements?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const startEdit = (p: AdPlacement) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description || "", status: p.status });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", description: "", status: "active" });
  };

  const filtered = placements.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-slate-400 hover:text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Ad Placements</h1>
            <p className="text-sm text-slate-500">Manage where church QR codes are placed</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Placement
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search placements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">
            {editingId ? "Edit Placement" : "New Ad Placement"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Billboard, Bus Ad, Flyer"
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "disabled" }))}
                className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editingId ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Slug</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Description</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    {placements.length === 0
                      ? "No ad placements yet. Create one to get started."
                      : "No placements match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-sm font-mono">{p.slug}</td>
                    <td className="px-4 py-3 text-slate-500 text-sm max-w-xs truncate">{p.description || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
