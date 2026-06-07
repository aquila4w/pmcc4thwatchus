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
  Globe,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface OnlinePlatform {
  id: string;
  name: string;
  slug: string;
  iconIdentifier: string;
  description?: string | null;
  urlTemplate?: string | null;
  color?: string | null;
  status: "active" | "disabled";
}

const PLATFORM_ICONS: Record<string, { label: string; color: string }> = {
  website: { label: "Website", color: "#F97316" },
  meta: { label: "Meta", color: "#1877F2" },
  tiktok: { label: "TikTok", color: "#000000" },
  youtube: { label: "YouTube", color: "#FF0000" },
  google: { label: "Google", color: "#4285F4" },
  eventbrite: { label: "Eventbrite", color: "#F05537" },
  instagram: { label: "Instagram", color: "#E4405F" },
  twitter: { label: "X/Twitter", color: "#000000" },
  linkedin: { label: "LinkedIn", color: "#0A66C2" },
  facebook: { label: "Facebook", color: "#1877F2" },
};

export default function OnlinePlatformsPage() {
  const [platforms, setPlatforms] = useState<OnlinePlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    iconIdentifier: "",
    description: "",
    urlTemplate: "",
    color: "",
    status: "active" as "active" | "disabled",
  });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/online-platforms");
      if (res.ok) {
        const data = await res.json();
        setPlatforms(data.docs || []);
      }
    } catch (err) {
      console.error("Failed to fetch online platforms:", err);
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
      const url = "/api/admin/online-platforms";
      const method = editingId ? "PATCH" : "POST";
      const body = editingId
        ? {
            id: editingId,
            name: form.name.trim(),
            iconIdentifier: form.iconIdentifier.trim(),
            description: form.description.trim(),
            urlTemplate: form.urlTemplate.trim(),
            color: form.color.trim(),
            status: form.status,
          }
        : {
            name: form.name.trim(),
            iconIdentifier: form.iconIdentifier.trim() || undefined,
            description: form.description.trim() || undefined,
            urlTemplate: form.urlTemplate.trim() || undefined,
            color: form.color.trim() || undefined,
            status: form.status,
          };

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
      console.error("Failed to save online platform:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this online platform? This will fail if any event links reference it.")) return;
    try {
      const res = await fetch(`/api/admin/online-platforms?id=${id}`, { method: "DELETE" });
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

  const handleSeed = async () => {
    if (!confirm("Seed default platforms (Website, Meta, TikTok, YouTube, Google, Eventbrite)? Existing platforms won't be duplicated.")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/online-platforms/seed", { method: "POST" });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to seed:", err);
    } finally {
      setSeeding(false);
    }
  };

  const startEdit = (p: OnlinePlatform) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      iconIdentifier: p.iconIdentifier || "",
      description: p.description || "",
      urlTemplate: p.urlTemplate || "",
      color: p.color || "",
      status: p.status,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", iconIdentifier: "", description: "", urlTemplate: "", color: "", status: "active" });
  };

  const filtered = platforms.filter((p) =>
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
            <h1 className="text-2xl font-semibold text-slate-900">Online Platforms</h1>
            <p className="text-sm text-slate-500">Manage social media and online platform QR codes</p>
          </div>
        </div>
        <div className="flex gap-2">
          {platforms.length === 0 && (
            <Button onClick={handleSeed} variant="outline" disabled={seeding} className="gap-2">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Seed Defaults
            </Button>
          )}
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Platform
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search platforms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">
            {editingId ? "Edit Platform" : "New Online Platform"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Meta, TikTok, YouTube"
              />
            </div>
            <div>
              <Label>Icon Identifier</Label>
              <Input
                value={form.iconIdentifier}
                onChange={(e) => setForm((f) => ({ ...f, iconIdentifier: e.target.value }))}
                placeholder="e.g., meta, tiktok (auto-filled from name)"
              />
            </div>
            <div>
              <Label>Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  placeholder="#1877F2"
                  className="flex-1"
                />
                {form.color && (
                  <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: form.color }} />
                )}
              </div>
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
              <Label>URL Template</Label>
              <Input
                value={form.urlTemplate}
                onChange={(e) => setForm((f) => ({ ...f, urlTemplate: e.target.value }))}
                placeholder="e.g., https://facebook.com/{handle}"
              />
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
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Platform</th>
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
                    {platforms.length === 0
                      ? "No online platforms yet. Click \"Seed Defaults\" to add Meta, TikTok, YouTube, Google, and Eventbrite."
                      : "No platforms match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: p.color || "#6B7280" }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
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
