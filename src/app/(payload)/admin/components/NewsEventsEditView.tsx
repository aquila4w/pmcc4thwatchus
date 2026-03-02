"use client";

import { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puck/config";
import {
  Save,
  Loader2,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Users,
  Eye,
  ArrowLeft,
  Check,
  AlertCircle,
  Monitor,
  Tablet,
  Smartphone,
  LayoutTemplate,
  X,
  ChevronRight,
  ChevronDown,
  Settings,
} from "lucide-react";
import { puckTemplates, PuckTemplate } from "@/lib/puck/templates";

type ViewportSize = "desktop" | "tablet" | "mobile";
const viewportSizes: Record<ViewportSize, { width: string; icon: typeof Monitor }> = {
  desktop: { width: "100%", icon: Monitor },
  tablet: { width: "768px", icon: Tablet },
  mobile: { width: "375px", icon: Smartphone },
};

const initialPuckData: Data = { content: [], root: {} };

interface NewsEventFormData {
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  eventDate: string;
  endDate: string;
  location: string;
  address: string;
  coordinates: { lat: number | null; lng: number | null };
  heroImage: string | null;
  featuredImage: string | null;
  requiresRegistration: boolean;
  registrationUrl: string;
  registrationDeadline: string;
  maxAttendees: number | null;
  registrationNote: string;
  isPublished: boolean;
  showOnHomepage: boolean;
  isFeatured: boolean;
  eventType: string;
  puckData: Data;
}

interface Props {
  documentId?: string;
  initialData?: Partial<NewsEventFormData>;
}

export function NewsEventsEditView({ documentId, initialData }: Props) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!documentId);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("schedule");

  const [formData, setFormData] = useState<NewsEventFormData>({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    eventDate: initialData?.eventDate || "",
    endDate: initialData?.endDate || "",
    location: initialData?.location || "",
    address: initialData?.address || "",
    coordinates: initialData?.coordinates || { lat: null, lng: null },
    heroImage: initialData?.heroImage || null,
    featuredImage: initialData?.featuredImage || null,
    requiresRegistration: initialData?.requiresRegistration || false,
    registrationUrl: initialData?.registrationUrl || "",
    registrationDeadline: initialData?.registrationDeadline || "",
    maxAttendees: initialData?.maxAttendees || null,
    registrationNote: initialData?.registrationNote || "",
    isPublished: initialData?.isPublished || false,
    showOnHomepage: initialData?.showOnHomepage || false,
    isFeatured: initialData?.isFeatured || false,
    eventType: initialData?.eventType || "event",
    puckData: initialData?.puckData || initialPuckData,
  });

  useEffect(() => {
    if (documentId) loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const response = await fetch(`/payload-api/news-events/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          title: data.title || "",
          subtitle: data.subtitle || "",
          slug: data.slug || "",
          description: data.description || "",
          eventDate: data.eventDate || "",
          endDate: data.endDate || "",
          location: data.location || "",
          address: data.address || "",
          coordinates: data.coordinates || { lat: null, lng: null },
          heroImage: data.heroImage?.id || data.heroImage || null,
          featuredImage: data.featuredImage?.id || data.featuredImage || null,
          requiresRegistration: data.requiresRegistration || false,
          registrationUrl: data.registrationUrl || "",
          registrationDeadline: data.registrationDeadline || "",
          maxAttendees: data.maxAttendees || null,
          registrationNote: data.registrationNote || "",
          isPublished: data.isPublished || false,
          showOnHomepage: data.showOnHomepage || false,
          isFeatured: data.isFeatured || false,
          eventType: data.eventType || "event",
          puckData: data.puckData || initialPuckData,
        });
      }
    } catch (error) {
      console.error("Failed to load:", error);
      showMessage("error", "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const updateField = (field: keyof NewsEventFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === "title" && !formData.slug) {
      setFormData(prev => ({ ...prev, slug: generateSlug(value as string) }));
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.location || !formData.eventDate) {
      showMessage("error", "Title, location, and date are required");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData, slug: formData.slug || generateSlug(formData.title), contentMode: "puck" };
      const url = documentId ? `/payload-api/news-events/${documentId}` : "/payload-api/news-events";
      const response = await fetch(url, {
        method: documentId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const result = await response.json();
        showMessage("success", "Saved!");
        if (!documentId && result.doc?.id) {
          window.history.pushState({}, "", `/cms/collections/news-events/${result.doc.id}`);
        }
      } else {
        const error = await response.json();
        showMessage("error", error.errors?.[0]?.message || "Failed to save");
      }
    } catch (error) {
      showMessage("error", "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = (template: PuckTemplate) => {
    if (formData.puckData.content.length > 0 && !confirm("Replace current content?")) return;
    setFormData(prev => ({ ...prev, puckData: template.data }));
    setShowTemplates(false);
    showMessage("success", `Template applied!`);
  };

  const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Compact Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/cms/collections/news-events" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Event Title"
            className="text-base font-semibold bg-transparent border-none text-white placeholder:text-slate-500 focus:outline-none w-64"
          />
          <span className="text-slate-600">/</span>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="slug"
            className="text-xs text-slate-400 bg-transparent border-none focus:outline-none w-32"
          />
        </div>
        <div className="flex items-center gap-2">
          {message && (
            <span className={`text-xs px-2 py-1 rounded ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              {message.type === "success" ? <Check className="w-3 h-3 inline mr-1" /> : <AlertCircle className="w-3 h-3 inline mr-1" />}
              {message.text}
            </span>
          )}
          <div className="flex border border-slate-700 rounded overflow-hidden">
            {(Object.keys(viewportSizes) as ViewportSize[]).map((size) => {
              const Icon = viewportSizes[size].icon;
              return (
                <button key={size} onClick={() => setViewport(size)} className={`p-1.5 ${viewport === size ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-white"}`}>
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowTemplates(true)} className="text-xs px-2 py-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded flex items-center gap-1">
            <LayoutTemplate className="w-3.5 h-3.5" /> Templates
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 rounded ${showSettings ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-white"}`}>
            <Settings className="w-4 h-4" />
          </button>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" checked={formData.isPublished} onChange={(e) => updateField("isPublished", e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-600 text-amber-500" />
            Published
          </label>
          {documentId && (
            <a href={`/events/${formData.slug || documentId}`} target="_blank" className="text-xs px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Preview
            </a>
          )}
          <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded font-semibold flex items-center gap-1 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Puck Editor - Main Area */}
        <div className="flex-1 h-[calc(100vh-49px)]">
          <Puck
            config={puckConfig}
            data={formData.puckData}
            onPublish={handleSave}
            onChange={(data) => setFormData(prev => ({ ...prev, puckData: data }))}
          />
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="w-72 bg-slate-800 border-l border-slate-700 overflow-y-auto h-[calc(100vh-49px)]">
            <div className="p-3 border-b border-slate-700 flex items-center justify-between">
              <span className="text-sm font-medium text-white">Event Settings</span>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Schedule Section */}
            <div className="border-b border-slate-700">
              <button onClick={() => toggleSection("schedule")} className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-700/50">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Schedule & Location
                </span>
                {expandedSection === "schedule" ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              {expandedSection === "schedule" && (
                <div className="px-3 pb-3 space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase">Start Date *</label>
                    <input type="datetime-local" value={formData.eventDate?.slice(0, 16) || ""} onChange={(e) => updateField("eventDate", e.target.value ? new Date(e.target.value).toISOString() : "")} className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase">End Date</label>
                    <input type="datetime-local" value={formData.endDate?.slice(0, 16) || ""} onChange={(e) => updateField("endDate", e.target.value ? new Date(e.target.value).toISOString() : "")} className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase">Location *</label>
                    <input type="text" value={formData.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Venue name" className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white placeholder:text-slate-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase">Address</label>
                    <textarea value={formData.address} onChange={(e) => updateField("address", e.target.value)} rows={2} className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white resize-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase">Event Type</label>
                    <select value={formData.eventType} onChange={(e) => updateField("eventType", e.target.value)} className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white">
                      <option value="event">Event</option>
                      <option value="conference">Conference</option>
                      <option value="crusade">Crusade</option>
                      <option value="worship">Worship</option>
                      <option value="training">Training</option>
                      <option value="youth">Youth</option>
                      <option value="news">News</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Media Section */}
            <div className="border-b border-slate-700">
              <button onClick={() => toggleSection("media")} className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-700/50">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" /> Images & Media
                </span>
                {expandedSection === "media" ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              {expandedSection === "media" && (
                <div className="px-3 pb-3 space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase">Hero Image URL</label>
                    <input type="text" value={formData.heroImage || ""} onChange={(e) => updateField("heroImage", e.target.value || null)} placeholder="https://..." className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white placeholder:text-slate-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase">Featured Image URL</label>
                    <input type="text" value={formData.featuredImage || ""} onChange={(e) => updateField("featuredImage", e.target.value || null)} placeholder="https://..." className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white placeholder:text-slate-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase">Description</label>
                    <textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} rows={2} placeholder="Brief description..." className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white placeholder:text-slate-500 resize-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Registration Section */}
            <div className="border-b border-slate-700">
              <button onClick={() => toggleSection("registration")} className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-700/50">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-amber-500" /> Registration
                </span>
                {expandedSection === "registration" ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              {expandedSection === "registration" && (
                <div className="px-3 pb-3 space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={formData.requiresRegistration} onChange={(e) => updateField("requiresRegistration", e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-600 text-amber-500" />
                    Requires Registration
                  </label>
                  {formData.requiresRegistration && (
                    <>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">External URL</label>
                        <input type="url" value={formData.registrationUrl} onChange={(e) => updateField("registrationUrl", e.target.value)} placeholder="https://..." className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white placeholder:text-slate-500" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Deadline</label>
                        <input type="datetime-local" value={formData.registrationDeadline?.slice(0, 16) || ""} onChange={(e) => updateField("registrationDeadline", e.target.value ? new Date(e.target.value).toISOString() : "")} className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Max Attendees</label>
                        <input type="number" value={formData.maxAttendees || ""} onChange={(e) => updateField("maxAttendees", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white placeholder:text-slate-500" />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Visibility Section */}
            <div className="p-3 space-y-2">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500" /> Visibility
              </span>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input type="checkbox" checked={formData.showOnHomepage} onChange={(e) => updateField("showOnHomepage", e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-600 text-amber-500" />
                Show on Homepage
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input type="checkbox" checked={formData.isFeatured} onChange={(e) => updateField("isFeatured", e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-600 text-amber-500" />
                Featured Event
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl max-w-3xl w-full max-h-[70vh] overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between p-3 border-b border-slate-700">
              <span className="text-sm font-medium text-white">Choose Template</span>
              <button onClick={() => setShowTemplates(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[calc(70vh-50px)] grid grid-cols-3 gap-3">
              {puckTemplates.map((template) => (
                <button key={template.id} onClick={() => handleApplyTemplate(template)} className="text-left p-3 bg-slate-700 border border-slate-600 rounded-lg hover:border-amber-500 transition-colors">
                  <div className="aspect-video bg-slate-600 rounded mb-2 flex items-center justify-center">
                    <LayoutTemplate className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="text-xs font-medium text-white truncate">{template.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Puck Dark Theme Styles */}
      <style jsx global>{`
        .Puck { --puck-color-azure-04: #c9a227; --puck-color-azure-05: #c9a227; background: #0f172a !important; }
        .Puck-header { display: none !important; }
        .Puck-leftSideBar, .Puck-rightSideBar { background: #1e293b !important; border-color: #334155 !important; }
        .Puck-frame { background: #0f172a !important; padding: 16px !important; display: flex !important; justify-content: center !important; }
        .Puck-frame > div { width: ${viewportSizes[viewport].width} !important; max-width: 100% !important; background: white !important; border-radius: ${viewport !== "desktop" ? "8px" : "0"} !important; box-shadow: ${viewport !== "desktop" ? "0 4px 20px rgba(0,0,0,0.3)" : "none"} !important; }
        .ComponentList { background: #1e293b !important; }
        .ComponentList-item { background: #334155 !important; border: 1px solid #475569 !important; border-radius: 6px !important; color: #e2e8f0 !important; }
        .ComponentList-item:hover { border-color: #c9a227 !important; }
        .ComponentList-category { color: #94a3b8 !important; font-size: 10px !important; }
        .FieldLabel { color: #cbd5e1 !important; font-size: 11px !important; }
        .Input, .TextArea, .Select { background: #334155 !important; border: 1px solid #475569 !important; color: #e2e8f0 !important; border-radius: 6px !important; font-size: 12px !important; }
        .Input:focus, .TextArea:focus { border-color: #c9a227 !important; }
        .Button--primary { background: #c9a227 !important; color: #0f172a !important; }
        .Button--secondary { background: #334155 !important; color: #e2e8f0 !important; }
      `}</style>
    </div>
  );
}

export default NewsEventsEditView;
