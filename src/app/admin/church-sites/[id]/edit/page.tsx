"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  GripVertical,
  Upload,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { THEME_LABELS, TEMPLATES } from "@/lib/church-site-types";

const hex = (cls: string) => (cls.match(/#([0-9a-fA-F]{3,8})/) || ["", "#6b7280"])[1];

interface ServiceItem {
  day: string;
  time: string;
  serviceName: string;
}

interface PastorItem {
  name: string;
  title: string;
  bio: string;
  photo: string;
  photoPreview: string;
}

interface UpdateItem {
  title: string;
  content: string;
  date: string;
  link: string;
}

interface GalleryItem {
  image: string;
  imagePreview: string;
  caption: string;
}

interface SiteFormData {
  published: boolean;
  template: string;
  welcomeTitle: string;
  missionStatement: string;
  serviceSchedule: ServiceItem[];
  pastors: PastorItem[];
  aboutContent: string;
  history: string;
  beliefs: string;
  gallery: GalleryItem[];
  latestUpdates: UpdateItem[];
  primaryColor: string;
  accentColor: string;
  facebook: string;
  instagram: string;
  youtube: string;
  website: string;
  churchName: string;
  churchSlug: string;
  heroImage: string;
  heroImagePreview: string;
  churchImage: string;
  churchImagePreview: string;
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function EditChurchSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<SiteFormData>({
    published: false,
    template: "modern",
    welcomeTitle: "Welcome to Our Church",
    missionStatement: "",
    serviceSchedule: [],
    pastors: [],
    aboutContent: "",
    history: "",
    beliefs: "",
    gallery: [],
    latestUpdates: [],
    primaryColor: "",
    accentColor: "",
    facebook: "",
    instagram: "",
    youtube: "",
    website: "",
    churchName: "",
    churchSlug: "",
    heroImage: "",
    heroImagePreview: "",
    churchImage: "",
    churchImagePreview: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugSaving, setSlugSaving] = useState(false);

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const res = await fetch(`/api/church-sites-admin/${id}`);
        if (!res.ok) throw new Error("Failed to load site");
        const data = await res.json();

        const site = data.site || data;
        setForm({
          published: site.published || false,
          template: site.template || "modern",
          welcomeTitle: site.welcomeTitle || "",
          missionStatement: site.missionStatement || "",
          serviceSchedule: site.serviceSchedule || [],
          pastors: (site.pastors || []).map((p: Record<string, unknown>) => {
            const photo = p.photo as Record<string, string> | string | null;
            return {
              name: (p.name as string) || "",
              title: (p.title as string) || "",
              bio: (p.bio as string) || "",
              photo: typeof photo === "object" && photo ? photo.id || "" : typeof photo === "string" ? photo : "",
              photoPreview: typeof photo === "object" && photo ? photo.url || "" : "",
            };
          }),
          aboutContent: "",
          history: "",
          beliefs: "",
          gallery: (site.gallery || []).map((g: Record<string, unknown>) => {
            const image = g.image as Record<string, string> | string | null;
            return {
              image: typeof image === "object" && image ? image.id || "" : typeof image === "string" ? image : "",
              imagePreview: typeof image === "object" && image ? image.url || "" : "",
              caption: (g.caption as string) || "",
            };
          }),
          latestUpdates: (site.latestUpdates || []).map((u: Record<string, unknown>) => ({
            title: (u.title as string) || "",
            content: (u.content as string) || "",
            date: (u.date as string) || "",
            link: (u.link as string) || "",
          })),
          primaryColor: site.customColors?.primaryColor || "",
          accentColor: site.customColors?.accentColor || "",
          facebook: site.socialLinks?.facebook || "",
          instagram: site.socialLinks?.instagram || "",
          youtube: site.socialLinks?.youtube || "",
          website: site.socialLinks?.website || "",
          churchName: site.church?.name || "",
          churchSlug: site.church?.slug || "",
          heroImage: typeof site.heroImage === "object" && site.heroImage ? (site.heroImage as { id: string }).id || "" : "",
          heroImagePreview: typeof site.heroImage === "object" && site.heroImage ? (site.heroImage as { url: string }).url || "" : "",
          churchImage: typeof data.church?.image === "object" && data.church.image ? (data.church.image as { id: string }).id || "" : "",
          churchImagePreview: typeof data.church?.image === "object" && data.church.image ? (data.church.image as { url: string }).url || "" : "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchSite();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/church-sites-admin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          published: form.published,
          template: form.template,
          welcomeTitle: form.welcomeTitle,
          missionStatement: form.missionStatement,
          serviceSchedule: form.serviceSchedule,
          pastors: form.pastors.map((p) => ({
            name: p.name,
            title: p.title,
            bio: p.bio,
            ...(p.photo ? { photo: p.photo } : {}),
          })),
          aboutContent: { root: { type: "paragraph", children: [{ type: "text", text: form.aboutContent }] } },
          history: { root: { type: "paragraph", children: [{ type: "text", text: form.history }] } },
          beliefs: { root: { type: "paragraph", children: [{ type: "text", text: form.beliefs }] } },
          gallery: form.gallery.map((g) => ({
            ...(g.image ? { image: g.image } : {}),
            caption: g.caption,
          })),
          latestUpdates: form.latestUpdates,
          customColors: {
            primaryColor: form.primaryColor,
            accentColor: form.accentColor,
          },
          socialLinks: {
            facebook: form.facebook,
            instagram: form.instagram,
            youtube: form.youtube,
            website: form.website,
          },
          ...(form.heroImage ? { heroImage: form.heroImage } : {}),
          ...(form.churchImage ? { churchImage: form.churchImage } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSlugSave = async () => {
    setSlugSaving(true);
    setSlugError(null);
    try {
      const res = await fetch(`/api/church-sites-admin/${id}/slug`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: form.churchSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update slug");
      setForm({ ...form, churchSlug: data.slug });
    } catch (err) {
      setSlugError(err instanceof Error ? err.message : "Failed to update slug");
    } finally {
      setSlugSaving(false);
    }
  };

  const uploadFile = async (file: File): Promise<{ id: string; url: string } | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("_payload", JSON.stringify({ alt: file.name.replace(/\.[^/.]+$/, "") }));
    try {
      const res = await fetch("/payload-api/media", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.doc ? { id: data.doc.id, url: data.doc.url } : null;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "General" },
    { id: "home", label: "Home Page" },
    { id: "schedule", label: "Service Schedule" },
    { id: "pastors", label: "Pastors" },
    { id: "about", label: "About" },
    { id: "gallery", label: "Gallery" },
    { id: "updates", label: "Updates" },
    { id: "social", label: "Social Links" },
    { id: "design", label: "Design" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/church-sites")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
              Edit: {form.churchName || "Church Site"}
            </h1>
            {form.churchSlug && (
              <p className="text-sm text-slate-500">{form.churchSlug}.pmcc4thwatch.us</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
          <p className="text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-slate-200 dark:border-slate-700 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-800 text-primary border border-b-0 border-slate-200 dark:border-slate-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card className="p-6">
        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 accent-primary"
              />
              <label htmlFor="published" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Published (visible to the public)
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subdomain Slug
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-w-md">
                  <Input
                    value={form.churchSlug}
                    onChange={(e) => setForm({ ...form, churchSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/(^-|-$)/g, "") })}
                    className="border-0 rounded-none flex-1"
                    placeholder="e.g., anchorage"
                  />
                  <span className="px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 text-sm whitespace-nowrap border-l border-slate-200 dark:border-slate-700">
                    .pmcc4thwatch.us
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSlugSave}
                  disabled={slugSaving}
                >
                  {slugSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Slug"}
                </Button>
              </div>
              {slugError && (
                <p className="text-red-500 text-xs mt-1">{slugError}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                Changes the subdomain URL. Only admins can edit this. Use lowercase letters, numbers, and hyphens.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Template
              </label>
              <select
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
                className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {Object.entries(THEME_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {TEMPLATES[form.template] && (() => {
                const t = TEMPLATES[form.template];
                const primary = `#${hex(t.primaryBg)}`;
                const accent = `#${hex(t.accentBg)}`;
                const footer = `#${hex(t.footerBg)}`;
                const heroFrom = `#${hex(t.heroGradient.split(" ")[0])}`;
                const heroTo = `#${hex(t.heroGradient.split(" ")[1])}`;
                const isSerif = t.fontSerif === "font-serif";
                return (
                  <div className="mt-3 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-w-sm shadow-sm">
                    <div className="flex text-[9px] font-semibold text-center">
                      <div className="flex-1 py-1" style={{ background: primary, color: "#fff" }}>{THEME_LABELS[form.template]}</div>
                    </div>
                    <div className="flex gap-0.5 p-1.5 bg-slate-100 dark:bg-slate-800">
                      <div className="flex-1 h-4 rounded-sm" style={{ background: primary }} />
                      <div className="flex-1 h-4 rounded-sm" style={{ background: accent }} />
                      <div className="flex-1 h-4 rounded-sm bg-white border border-slate-200" />
                      <div className="flex-1 h-4 rounded-sm" style={{ background: footer }} />
                    </div>
                    <div style={{ background: "#fff" }}>
                      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: primary, color: "#fff", fontFamily: isSerif ? "Georgia,serif" : "system-ui,sans-serif" }}>
                        <span className="text-[10px] font-bold">{form.welcomeTitle || "Our Church"}</span>
                        <span className="text-[9px] opacity-70 flex gap-2"><span style={{ color: accent }}>Home</span>About</span>
                      </div>
                      <div className="px-4 py-5 text-center" style={{ background: `linear-gradient(135deg,${heroFrom},${heroTo})`, color: "#fff", fontFamily: isSerif ? "Georgia,serif" : "system-ui,sans-serif" }}>
                        <div className="text-sm font-bold mb-0.5">Welcome to Our Church</div>
                        <div className="text-[9px] opacity-80">Join us in worship and fellowship</div>
                        <div className="inline-block mt-2 px-3 py-1 text-[9px] font-bold" style={{ background: accent, color: primary === "#0a0a0a" || primary === "#1a1a1a" || primary === "#1c1c1c" ? "#fff" : primary, borderRadius: t.buttonRadius === "rounded-full" ? 9999 : t.buttonRadius === "rounded-none" ? 0 : t.buttonRadius === "rounded-xl" ? 12 : t.buttonRadius === "rounded-2xl" ? 16 : 6 }}>Visit Us</div>
                      </div>
                      <div className="px-3 py-2" style={{ background: "#f8fafc" }}>
                        <div className="text-[9px] font-bold mb-1" style={{ color: primary }}>Service Schedule</div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-[8px] p-1 rounded" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
                            <span className="font-bold" style={{ color: primary }}>Sunday</span>
                            <span className="opacity-70 ml-1">10:00 AM</span>
                          </div>
                          <div className="text-[8px] p-1 rounded" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
                            <span className="font-bold" style={{ color: primary }}>Wednesday</span>
                            <span className="opacity-70 ml-1">7:00 PM</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-2 text-center text-[8px]" style={{ background: footer, color: "#fff", opacity: 0.8 }}>
                        &copy; 2026 PMCC 4th Watch
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === "home" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Welcome Title
              </label>
              <Input
                value={form.welcomeTitle}
                onChange={(e) => setForm({ ...form, welcomeTitle: e.target.value })}
                placeholder="Welcome to Our Church"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mission Statement
              </label>
              <textarea
                value={form.missionStatement}
                onChange={(e) => setForm({ ...form, missionStatement: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="A brief mission statement for the church..."
              />
            </div>

            {/* Hero Image */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hero Image
              </label>
              <p className="text-xs text-slate-400 mb-2">Displayed as the background banner at the top of the church homepage.</p>
              {form.heroImagePreview ? (
                <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={form.heroImagePreview} alt="Hero" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-white text-slate-900 rounded text-sm font-medium hover:bg-slate-100">
                      Replace
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const result = await uploadFile(file);
                          if (result) {
                            setForm({ ...form, heroImage: result.id, heroImagePreview: result.url });
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, heroImage: "", heroImagePreview: "" })}
                      className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">Upload hero image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const result = await uploadFile(file);
                      if (result) {
                        setForm({ ...form, heroImage: result.id, heroImagePreview: result.url });
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {/* Church Picture */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Church Picture
              </label>
              <p className="text-xs text-slate-400 mb-2">A photo of the church building or grounds. Used as fallback if no hero image is set.</p>
              {form.churchImagePreview ? (
                <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 inline-block">
                  <img src={form.churchImagePreview} alt="Church" className="w-32 h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <label className="cursor-pointer px-2 py-1 bg-white text-slate-900 rounded text-xs font-medium hover:bg-slate-100">
                      Replace
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const result = await uploadFile(file);
                          if (result) {
                            setForm({ ...form, churchImage: result.id, churchImagePreview: result.url });
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, churchImage: "", churchImagePreview: "" })}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-32 h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-xs text-slate-500">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const result = await uploadFile(file);
                      if (result) {
                        setForm({ ...form, churchImage: result.id, churchImagePreview: result.url });
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Weekly Service Schedule
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm({
                    ...form,
                    serviceSchedule: [...form.serviceSchedule, { day: "sunday", time: "", serviceName: "" }],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Service
              </Button>
            </div>
            {form.serviceSchedule.map((service, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <select
                  value={service.day}
                  onChange={(e) => {
                    const updated = [...form.serviceSchedule];
                    updated[i] = { ...updated[i], day: e.target.value };
                    setForm({ ...form, serviceSchedule: updated });
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
                <Input
                  placeholder="Service name (e.g., Morning Worship)"
                  value={service.serviceName}
                  onChange={(e) => {
                    const updated = [...form.serviceSchedule];
                    updated[i] = { ...updated[i], serviceName: e.target.value };
                    setForm({ ...form, serviceSchedule: updated });
                  }}
                  className="flex-1"
                />
                <Input
                  placeholder="Time (e.g., 10:00 AM)"
                  value={service.time}
                  onChange={(e) => {
                    const updated = [...form.serviceSchedule];
                    updated[i] = { ...updated[i], time: e.target.value };
                    setForm({ ...form, serviceSchedule: updated });
                  }}
                  className="w-36"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setForm({
                      ...form,
                      serviceSchedule: form.serviceSchedule.filter((_, idx) => idx !== i),
                    });
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))}
            {form.serviceSchedule.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No services added yet.</p>
            )}
          </div>
        )}

        {activeTab === "pastors" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Pastors & Leaders
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm({
                    ...form,
                    pastors: [...form.pastors, { name: "", title: "", bio: "", photo: "", photoPreview: "" }],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Pastor
              </Button>
            </div>
            {form.pastors.map((pastor, i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Pastor {i + 1}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setForm({ ...form, pastors: form.pastors.filter((_, idx) => idx !== i) });
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center relative group">
                      {pastor.photoPreview ? (
                        <img src={pastor.photoPreview} alt={pastor.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-slate-400" />
                      )}
                      {pastor.photoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...form.pastors];
                            updated[i] = { ...updated[i], photo: "", photoPreview: "" };
                            setForm({ ...form, pastors: updated });
                          }}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <label className="cursor-pointer text-xs text-primary hover:underline">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const result = await uploadFile(file);
                          if (result) {
                            const updated = [...form.pastors];
                            updated[i] = { ...updated[i], photo: result.id, photoPreview: result.url };
                            setForm({ ...form, pastors: updated });
                          }
                        }}
                      />
                      Upload Photo
                    </label>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Name"
                        value={pastor.name}
                        onChange={(e) => {
                          const updated = [...form.pastors];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setForm({ ...form, pastors: updated });
                        }}
                      />
                      <Input
                        placeholder="Title (e.g., Head Minister)"
                        value={pastor.title}
                        onChange={(e) => {
                          const updated = [...form.pastors];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setForm({ ...form, pastors: updated });
                        }}
                      />
                    </div>
                    <textarea
                      placeholder="Brief bio..."
                      value={pastor.bio}
                      onChange={(e) => {
                        const updated = [...form.pastors];
                        updated[i] = { ...updated[i], bio: e.target.value };
                        setForm({ ...form, pastors: updated });
                      }}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "about" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                About Content
              </label>
              <textarea
                value={form.aboutContent}
                onChange={(e) => setForm({ ...form, aboutContent: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                placeholder="Tell visitors about the church..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Church History
              </label>
              <textarea
                value={form.history}
                onChange={(e) => setForm({ ...form, history: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                placeholder="History of this local church..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Core Beliefs
              </label>
              <textarea
                value={form.beliefs}
                onChange={(e) => setForm({ ...form, beliefs: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                placeholder="What this church believes..."
              />
            </div>
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Gallery Images
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm({
                    ...form,
                    gallery: [...form.gallery, { image: "", imagePreview: "", caption: "" }],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Image
              </Button>
            </div>
            {form.gallery.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  {item.imagePreview ? (
                    <img src={item.imagePreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="cursor-pointer text-xs text-primary hover:underline">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const result = await uploadFile(file);
                        if (result) {
                          const updated = [...form.gallery];
                          updated[i] = { ...updated[i], image: result.id, imagePreview: result.url };
                          setForm({ ...form, gallery: updated });
                        }
                      }}
                    />
                    {item.image ? "Change Image" : "Upload Image"}
                  </label>
                  <Input
                    placeholder="Caption (optional)"
                    value={item.caption}
                    onChange={(e) => {
                      const updated = [...form.gallery];
                      updated[i] = { ...updated[i], caption: e.target.value };
                      setForm({ ...form, gallery: updated });
                    }}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setForm({ ...form, gallery: form.gallery.filter((_, idx) => idx !== i) });
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "updates" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Latest Updates & Events
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm({
                    ...form,
                    latestUpdates: [...form.latestUpdates, { title: "", content: "", date: "", link: "" }],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Update
              </Button>
            </div>
            {form.latestUpdates.map((update, i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Update {i + 1}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setForm({ ...form, latestUpdates: form.latestUpdates.filter((_, idx) => idx !== i) });
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
                <Input
                  placeholder="Title"
                  value={update.title}
                  onChange={(e) => {
                    const updated = [...form.latestUpdates];
                    updated[i] = { ...updated[i], title: e.target.value };
                    setForm({ ...form, latestUpdates: updated });
                  }}
                />
                <textarea
                  placeholder="Content"
                  value={update.content}
                  onChange={(e) => {
                    const updated = [...form.latestUpdates];
                    updated[i] = { ...updated[i], content: e.target.value };
                    setForm({ ...form, latestUpdates: updated });
                  }}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    value={update.date}
                    onChange={(e) => {
                      const updated = [...form.latestUpdates];
                      updated[i] = { ...updated[i], date: e.target.value };
                      setForm({ ...form, latestUpdates: updated });
                    }}
                  />
                  <Input
                    placeholder="Link (optional)"
                    value={update.link}
                    onChange={(e) => {
                      const updated = [...form.latestUpdates];
                      updated[i] = { ...updated[i], link: e.target.value };
                      setForm({ ...form, latestUpdates: updated });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Facebook</label>
              <Input
                placeholder="https://facebook.com/..."
                value={form.facebook}
                onChange={(e) => setForm({ ...form, facebook: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Instagram</label>
              <Input
                placeholder="https://instagram.com/..."
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">YouTube</label>
              <Input
                placeholder="https://youtube.com/..."
                value={form.youtube}
                onChange={(e) => setForm({ ...form, youtube: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website</label>
              <Input
                placeholder="https://..."
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
          </div>
        )}

        {activeTab === "design" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Override the template&apos;s default colors. Leave blank to use template defaults.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor || "#1a365d"}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="h-10 w-10 rounded border border-slate-200"
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  placeholder="#1a365d"
                  className="max-w-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.accentColor || "#c9a84c"}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="h-10 w-10 rounded border border-slate-200"
                />
                <Input
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  placeholder="#c9a84c"
                  className="max-w-xs"
                />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
