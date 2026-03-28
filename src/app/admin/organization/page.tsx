"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  Plus,
  Pencil,
  Trash2,
  Church,
  MapPin,
  Building2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ---------- Types ----------
interface SubDistrict {
  id: string;
  name: string;
  number: number;
  description?: string | null;
  coordinator?: { id: string; name: string } | null;
}

interface ChurchRecord {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  address: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  subDistrict: { id: string; name: string } | null;
  headMinister?: { id: string; name: string } | null;
  secretary?: { id: string; name: string } | null;
}

// ---------- Component ----------
export default function OrganizationPage() {
  const [tab, setTab] = useState<"subdistricts" | "churches">("subdistricts");
  const [loading, setLoading] = useState(true);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [churches, setChurches] = useState<ChurchRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit dialogs
  const [sdDialog, setSdDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    id: string;
    name: string;
    number: string;
    description: string;
  }>({ open: false, mode: "create", id: "", name: "", number: "", description: "" });

  const [churchDialog, setChurchDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
    address: string;
    zip: string;
    phone: string;
    email: string;
    subDistrict: string;
  }>({
    open: false, mode: "create", id: "", name: "", slug: "", city: "", state: "",
    address: "", zip: "", phone: "", email: "", subDistrict: "",
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "subdistrict" | "church";
    id: string;
    name: string;
  }>({ open: false, type: "subdistrict", id: "", name: "" });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sdRes, chRes] = await Promise.all([
        fetch("/api/admin/sub-districts"),
        fetch("/api/admin/churches"),
      ]);
      if (sdRes.ok) {
        const sdData = await sdRes.json();
        setSubDistricts(sdData.docs || []);
      }
      if (chRes.ok) {
        const chData = await chRes.json();
        setChurches(chData.docs || []);
      }
    } catch (error) {
      console.error("Failed to fetch organization data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Sub-District CRUD ---
  const saveSubDistrict = async () => {
    setSaving(true);
    try {
      const url = sdDialog.mode === "create" ? "/api/admin/sub-districts" : "/api/admin/sub-districts";
      const method = sdDialog.mode === "create" ? "POST" : "PATCH";
      const body = sdDialog.mode === "create"
        ? { name: sdDialog.name, number: sdDialog.number, description: sdDialog.description }
        : { id: sdDialog.id, name: sdDialog.name, number: sdDialog.number, description: sdDialog.description };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSdDialog({ open: false, mode: "create", id: "", name: "", number: "", description: "" });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Failed to save sub-district:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async () => {
    setSaving(true);
    try {
      const url = deleteDialog.type === "subdistrict"
        ? `/api/admin/sub-districts?id=${deleteDialog.id}`
        : `/api/admin/churches?id=${deleteDialog.id}`;

      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        setDeleteDialog({ open: false, type: "subdistrict", id: "", name: "" });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setSaving(false);
    }
  };

  // --- Church CRUD ---
  const saveChurch = async () => {
    setSaving(true);
    try {
      const method = churchDialog.mode === "create" ? "POST" : "PATCH";
      const body = churchDialog.mode === "create"
        ? {
            name: churchDialog.name,
            slug: churchDialog.slug,
            city: churchDialog.city,
            state: churchDialog.state,
            address: churchDialog.address || undefined,
            zip: churchDialog.zip || undefined,
            phone: churchDialog.phone || undefined,
            email: churchDialog.email || undefined,
            subDistrict: churchDialog.subDistrict || undefined,
          }
        : {
            id: churchDialog.id,
            name: churchDialog.name,
            slug: churchDialog.slug,
            city: churchDialog.city,
            state: churchDialog.state,
            address: churchDialog.address || null,
            zip: churchDialog.zip || null,
            phone: churchDialog.phone || null,
            email: churchDialog.email || null,
            subDistrict: churchDialog.subDistrict || null,
          };

      const res = await fetch("/api/admin/churches", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setChurchDialog({
          open: false, mode: "create", id: "", name: "", slug: "", city: "", state: "",
          address: "", zip: "", phone: "", email: "", subDistrict: "",
        });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Failed to save church:", error);
    } finally {
      setSaving(false);
    }
  };

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Filtered lists
  const filteredSDs = subDistricts.filter((sd) =>
    sd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sd.number.toString().includes(searchTerm)
  );

  const filteredChurches = churches.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.state || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group churches by sub-district
  const churchesBySD = subDistricts.map((sd) => ({
    ...sd,
    churches: churches.filter((c) => c.subDistrict?.id === sd.id),
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organization</h1>
        <p className="text-slate-500 mt-1">Manage sub-districts, churches, and assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subDistricts.length}</p>
              <p className="text-sm text-slate-500">Sub-Districts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Church className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{churches.length}</p>
              <p className="text-sm text-slate-500">Churches</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {churches.filter((c) => !c.subDistrict).length}
              </p>
              <p className="text-sm text-slate-500">Unassigned Churches</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={tab === "subdistricts" ? "default" : "outline"}
          onClick={() => { setTab("subdistricts"); setSearchTerm(""); }}
        >
          <Building2 className="w-4 h-4 mr-2" />
          Sub-Districts ({subDistricts.length})
        </Button>
        <Button
          variant={tab === "churches" ? "default" : "outline"}
          onClick={() => { setTab("churches"); setSearchTerm(""); }}
        >
          <Church className="w-4 h-4 mr-2" />
          Churches ({churches.length})
        </Button>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={tab === "subdistricts" ? "Search sub-districts..." : "Search churches..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => {
            if (tab === "subdistricts") {
              setSdDialog({ open: true, mode: "create", id: "", name: "", number: "", description: "" });
            } else {
              setChurchDialog({
                open: true, mode: "create", id: "", name: "", slug: "", city: "", state: "NY",
                address: "", zip: "", phone: "", email: "", subDistrict: "",
              });
            }
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {tab === "subdistricts" ? "Sub-District" : "Church"}
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : tab === "subdistricts" ? (
        /* Sub-Districts List */
        <div className="space-y-4">
          {filteredSDs.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No sub-districts found</p>
            </Card>
          ) : (
            filteredSDs.map((sd) => {
              const sdChurches = churches.filter((c) => c.subDistrict?.id === sd.id);
              return (
                <Card key={sd.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                          #{sd.number}
                        </Badge>
                        <h3 className="text-lg font-semibold">{sd.name}</h3>
                        <Badge variant="outline">{sdChurches.length} churches</Badge>
                      </div>
                      {sd.description && (
                        <p className="text-sm text-slate-500 mb-2">{sd.description}</p>
                      )}
                      {sd.coordinator && (
                        <p className="text-sm text-slate-600">
                          Coordinator: <span className="font-medium">{sd.coordinator.name}</span>
                        </p>
                      )}
                      {/* Churches in this sub-district */}
                      {sdChurches.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {sdChurches.map((c) => (
                            <Badge key={c.id} variant="secondary" className="bg-emerald-50 text-emerald-700">
                              {c.name} {c.city ? `(${c.city})` : ""}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSdDialog({
                          open: true, mode: "edit", id: sd.id,
                          name: sd.name, number: sd.number.toString(),
                          description: sd.description || "",
                        })}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteDialog({ open: true, type: "subdistrict", id: sd.id, name: sd.name })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        /* Churches List */
        <div className="space-y-4">
          {filteredChurches.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">
              <Church className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No churches found</p>
            </Card>
          ) : (
            filteredChurches.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Church className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-lg font-semibold">{c.name}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-600">
                      {c.city && c.state && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{c.city}, {c.state} {c.zip || ""}</span>
                        </div>
                      )}
                      {c.subDistrict && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{c.subDistrict.name}</span>
                        </div>
                      )}
                      {!c.subDistrict && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 w-fit">
                          No sub-district assigned
                        </Badge>
                      )}
                    </div>
                    {(c.phone || c.email) && (
                      <div className="mt-2 text-sm text-slate-500">
                        {c.phone && <span className="mr-4">{c.phone}</span>}
                        {c.email && <span>{c.email}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChurchDialog({
                        open: true, mode: "edit", id: c.id,
                        name: c.name, slug: c.slug || "",
                        city: c.city || "", state: c.state || "",
                        address: c.address || "", zip: c.zip || "",
                        phone: c.phone || "", email: c.email || "",
                        subDistrict: c.subDistrict?.id || "",
                      })}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteDialog({ open: true, type: "church", id: c.id, name: c.name })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Sub-District Dialog */}
      <Dialog open={sdDialog.open} onOpenChange={(open) => setSdDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{sdDialog.mode === "create" ? "Add Sub-District" : "Edit Sub-District"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sub-District Number</Label>
              <Input
                type="number"
                min={1} max={8}
                value={sdDialog.number}
                onChange={(e) => setSdDialog((prev) => ({ ...prev, number: e.target.value }))}
                placeholder="1-8"
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={sdDialog.name}
                onChange={(e) => setSdDialog((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Sub-District 1 - Northeast"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={sdDialog.description}
                onChange={(e) => setSdDialog((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSdDialog((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button onClick={saveSubDistrict} disabled={saving || !sdDialog.name || !sdDialog.number}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {sdDialog.mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Church Dialog */}
      <Dialog open={churchDialog.open} onOpenChange={(open) => setChurchDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{churchDialog.mode === "create" ? "Add Church" : "Edit Church"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Church Name *</Label>
                <Input
                  value={churchDialog.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setChurchDialog((prev) => ({
                      ...prev,
                      name,
                      ...(prev.mode === "create" ? { slug: generateSlug(name) } : {}),
                    }));
                  }}
                  placeholder="PMCC 4th Watch - City Name"
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug *</Label>
                <Input
                  value={churchDialog.slug}
                  onChange={(e) => setChurchDialog((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="pmcc-4th-watch-city"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sub-District *</Label>
              <select
                value={churchDialog.subDistrict}
                onChange={(e) => setChurchDialog((prev) => ({ ...prev, subDistrict: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select a sub-district</option>
                {subDistricts.map((sd) => (
                  <option key={sd.id} value={sd.id}>
                    #{sd.number} - {sd.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  value={churchDialog.city}
                  onChange={(e) => setChurchDialog((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input
                  value={churchDialog.state}
                  onChange={(e) => setChurchDialog((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="NY"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={churchDialog.address}
                onChange={(e) => setChurchDialog((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ZIP Code</Label>
                <Input
                  value={churchDialog.zip}
                  onChange={(e) => setChurchDialog((prev) => ({ ...prev, zip: e.target.value }))}
                  placeholder="10001"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={churchDialog.phone}
                  onChange={(e) => setChurchDialog((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={churchDialog.email}
                onChange={(e) => setChurchDialog((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="church@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChurchDialog((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button onClick={saveChurch} disabled={saving || !churchDialog.name || !churchDialog.slug}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {churchDialog.mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {deleteDialog.type === "subdistrict" ? "Sub-District" : "Church"}</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-slate-600">
            Are you sure you want to delete <strong>{deleteDialog.name}</strong>?
            {deleteDialog.type === "subdistrict" && " Churches in this sub-district will become unassigned."}
            {deleteDialog.type === "church" && " Users assigned to this church must be reassigned first."}
            This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteItem} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
