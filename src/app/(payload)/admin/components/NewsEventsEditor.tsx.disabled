"use client";

import { useState, useEffect, useCallback } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puck/config";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Calendar,
  MapPin,
  Image as ImageIcon,
  FileText,
  Users,
  Check,
  ChevronDown,
  Upload,
  X,
  Globe,
  Clock,
  Mail,
  Phone,
  Tag,
  LayoutTemplate,
} from "lucide-react";
import { puckTemplates, PuckTemplate } from "@/lib/puck/templates";

// Tab types
type TabType = "schedule" | "media" | "content" | "registration";

// Initial empty Puck data
const initialPuckData: Data = {
  content: [],
  root: {},
};

// Form data interface
interface NewsEventFormData {
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  // Schedule
  eventDate: string;
  endDate: string;
  location: string;
  address: string;
  coordinates: { lat: number | null; lng: number | null };
  // Media
  heroImage: string | null;
  featuredImage: string | null;
  gallery: Array<{ image: string; caption: string }>;
  // Content
  contentMode: "richtext" | "blocks" | "puck";
  content: string;
  puckData: Data;
  // Registration
  requiresRegistration: boolean;
  registrationUrl: string;
  registrationDeadline: string;
  maxAttendees: number | null;
  registrationNote: string;
  // Settings
  isPublished: boolean;
  showOnHomepage: boolean;
  isFeatured: boolean;
  eventType: string;
  contactEmail: string;
  contactPhone: string;
}

const initialFormData: NewsEventFormData = {
  title: "",
  subtitle: "",
  slug: "",
  description: "",
  eventDate: "",
  endDate: "",
  location: "",
  address: "",
  coordinates: { lat: null, lng: null },
  heroImage: null,
  featuredImage: null,
  gallery: [],
  contentMode: "puck",
  content: "",
  puckData: initialPuckData,
  requiresRegistration: false,
  registrationUrl: "",
  registrationDeadline: "",
  maxAttendees: null,
  registrationNote: "",
  isPublished: false,
  showOnHomepage: false,
  isFeatured: false,
  eventType: "event",
  contactEmail: "",
  contactPhone: "",
};

const eventTypes = [
  { label: "Event", value: "event" },
  { label: "News", value: "news" },
  { label: "Announcement", value: "announcement" },
  { label: "Conference", value: "conference" },
  { label: "Training", value: "training" },
  { label: "Worship", value: "worship" },
  { label: "Crusade", value: "crusade" },
  { label: "Youth", value: "youth" },
];

export function NewsEventsEditor({ eventId }: { eventId?: string }) {
  const [formData, setFormData] = useState<NewsEventFormData>(initialFormData);
  const [activeTab, setActiveTab] = useState<TabType>("schedule");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!eventId);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPuckEditor, setShowPuckEditor] = useState(false);

  // Load existing event data
  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/payload-api/news-events/${eventId}`);
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
          gallery: data.gallery || [],
          contentMode: data.contentMode || "puck",
          content: data.content || "",
          puckData: data.puckData || initialPuckData,
          requiresRegistration: data.requiresRegistration || false,
          registrationUrl: data.registrationUrl || "",
          registrationDeadline: data.registrationDeadline || "",
          maxAttendees: data.maxAttendees || null,
          registrationNote: data.registrationNote || "",
          isPublished: data.isPublished || false,
          showOnHomepage: data.showOnHomepage || false,
          isFeatured: data.isFeatured || false,
          eventType: data.eventType || "event",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
        });
      }
    } catch (error) {
      console.error("Failed to load event:", error);
      showMessage("error", "Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const updateField = <K extends keyof NewsEventFormData>(field: K, value: NewsEventFormData[K]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from title
      if (field === "title" && !prev.slug) {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!formData.title) {
      showMessage("error", "Title is required");
      return;
    }
    if (!formData.eventDate) {
      showMessage("error", "Event date is required");
      setActiveTab("schedule");
      return;
    }
    if (!formData.location) {
      showMessage("error", "Location is required");
      setActiveTab("schedule");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
      };

      const url = eventId
        ? `/payload-api/news-events/${eventId}`
        : "/payload-api/news-events";

      const response = await fetch(url, {
        method: eventId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        showMessage("success", eventId ? "Event updated successfully!" : "Event created successfully!");
        if (!eventId && result.doc?.id) {
          // Redirect to edit page
          window.location.href = `/cms/news-events/edit/${result.doc.id}`;
        }
      } else {
        const error = await response.json();
        showMessage("error", error.message || "Failed to save event");
      }
    } catch (error) {
      console.error("Save error:", error);
      showMessage("error", "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = (template: PuckTemplate) => {
    if (formData.puckData.content.length > 0) {
      if (!confirm("Applying a template will replace your current content. Continue?")) {
        return;
      }
    }
    updateField("puckData", template.data);
    setShowTemplates(false);
    showMessage("success", `Template "${template.name}" applied!`);
  };

  const tabs: { id: TabType; label: string; icon: typeof Calendar }[] = [
    { id: "schedule", label: "Schedule & Location", icon: Calendar },
    { id: "media", label: "Images & Media", icon: ImageIcon },
    { id: "content", label: "Content", icon: FileText },
    { id: "registration", label: "Registration", icon: Users },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading event data...</span>
        </div>
      </div>
    );
  }

  if (showPuckEditor) {
    return (
      <div className="min-h-screen bg-slate-100">
        {/* Puck Editor Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowPuckEditor(false)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Form
            </button>
            <div className="w-px h-6 bg-slate-700" />
            <h1 className="text-white font-semibold">{formData.title || "New Event"} - Page Designer</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Templates Button */}
            <button
              type="button"
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <LayoutTemplate className="w-4 h-4" />
              Templates
            </button>

            {/* Save & Close */}
            <button
              type="button"
              onClick={() => setShowPuckEditor(false)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              Done
            </button>
          </div>
        </div>

        {/* Templates Modal */}
        {showTemplates && (
          <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-slate-700">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white">Choose a Template</h2>
                <button
                  type="button"
                  onClick={() => setShowTemplates(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                {["event", "landing", "ministry", "about", "contact", "general"].map((category) => {
                  const categoryTemplates = puckTemplates.filter(t => t.category === category);
                  if (categoryTemplates.length === 0) return null;
                  return (
                    <div key={category} className="mb-8">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        {category.charAt(0).toUpperCase() + category.slice(1)} Pages
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {categoryTemplates.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => handleApplyTemplate(template)}
                            className="text-left p-4 bg-slate-700 border border-slate-600 rounded-xl hover:border-amber-500 hover:bg-slate-600 transition-colors group"
                          >
                            <div className="aspect-video bg-slate-600 rounded-lg mb-3 flex items-center justify-center">
                              <LayoutTemplate className="w-8 h-8 text-slate-400 group-hover:text-amber-500 transition-colors" />
                            </div>
                            <h4 className="font-semibold text-white mb-1 group-hover:text-amber-400">
                              {template.name}
                            </h4>
                            <p className="text-sm text-slate-400 line-clamp-2">
                              {template.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Puck Editor */}
        <div className="pt-14">
          <Puck
            config={puckConfig}
            data={formData.puckData}
            onPublish={(data) => {
              updateField("puckData", data);
              setShowPuckEditor(false);
            }}
            onChange={(data) => updateField("puckData", data)}
          />
        </div>

        <style jsx global>{`
          .Puck { --puck-color-azure-04: #c9a227; --puck-color-azure-05: #c9a227; }
          .Puck-header { display: none !important; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Fixed Header with Save Button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/cms/collections/news-events"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {eventId ? "Edit Event" : "Create New Event"}
                </h1>
                <p className="text-sm text-slate-400">
                  {formData.title || "Untitled Event"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Message */}
              {message && (
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  message.type === "success"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                  {message.text}
                </div>
              )}

              {/* Preview Button */}
              {eventId && (
                <Link
                  href={`/events/${formData.slug}`}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors border border-slate-600"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Link>
              )}

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/20"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save Event"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Basic Info Section */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-500" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  placeholder="A short tagline"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  URL Slug
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-3 bg-slate-600 border border-slate-600 border-r-0 rounded-l-lg text-slate-400 text-sm">
                    /events/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-r-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    placeholder="event-slug"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Short Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none"
                  placeholder="Brief description for listings (max 300 characters)"
                  maxLength={300}
                />
                <p className="text-xs text-slate-500 mt-1">{formData.description.length}/300 characters</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-700">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? "text-amber-500 bg-slate-700/50"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Schedule & Location Tab */}
              {activeTab === "schedule" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Start Date & Time <span className="text-amber-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.eventDate ? formData.eventDate.slice(0, 16) : ""}
                        onChange={(e) => updateField("eventDate", e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endDate ? formData.endDate.slice(0, 16) : ""}
                        onChange={(e) => updateField("endDate", e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Venue Name <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                      placeholder="e.g., Los Angeles Convention Center"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none"
                      placeholder="Full street address for directions"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Latitude (optional)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.coordinates.lat || ""}
                        onChange={(e) => updateField("coordinates", { ...formData.coordinates, lat: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                        placeholder="34.0522"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Longitude (optional)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.coordinates.lng || ""}
                        onChange={(e) => updateField("coordinates", { ...formData.coordinates, lng: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                        placeholder="-118.2437"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Images & Media Tab */}
              {activeTab === "media" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Hero Image
                      </label>
                      <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-amber-500 transition-colors cursor-pointer">
                        <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                          Recommended: 1200x630px
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Featured Image
                      </label>
                      <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-amber-500 transition-colors cursor-pointer">
                        <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                          Secondary image for detailed views
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Gallery Images
                    </label>
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-amber-500 transition-colors cursor-pointer">
                      <ImageIcon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">
                        Add multiple images for the event gallery
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Tab */}
              {activeTab === "content" && (
                <div className="space-y-6">
                  <div className="bg-slate-700/50 rounded-lg p-6 text-center">
                    <FileText className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Visual Page Designer
                    </h3>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">
                      Design your event page with our drag-and-drop builder. Add hero sections, schedules, speakers, and more.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => setShowPuckEditor(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-semibold transition-colors"
                      >
                        <FileText className="w-5 h-5" />
                        Open Page Designer
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTemplates(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors"
                      >
                        <LayoutTemplate className="w-5 h-5" />
                        Start with Template
                      </button>
                    </div>
                    {formData.puckData.content.length > 0 && (
                      <p className="text-green-400 text-sm mt-4 flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        {formData.puckData.content.length} component(s) added
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Registration Tab */}
              {activeTab === "registration" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.requiresRegistration}
                        onChange={(e) => updateField("requiresRegistration", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                    </label>
                    <span className="text-white font-medium">Enable Registration</span>
                  </div>

                  {formData.requiresRegistration && (
                    <div className="space-y-4 pt-4 border-t border-slate-700">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          External Registration URL
                        </label>
                        <input
                          type="url"
                          value={formData.registrationUrl}
                          onChange={(e) => updateField("registrationUrl", e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                          placeholder="https://eventbrite.com/..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Registration Deadline
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.registrationDeadline ? formData.registrationDeadline.slice(0, 16) : ""}
                            onChange={(e) => updateField("registrationDeadline", e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Maximum Attendees
                          </label>
                          <input
                            type="number"
                            value={formData.maxAttendees || ""}
                            onChange={(e) => updateField("maxAttendees", e.target.value ? Number(e.target.value) : null)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                            placeholder="Leave empty for unlimited"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Registration Note
                        </label>
                        <textarea
                          value={formData.registrationNote}
                          onChange={(e) => updateField("registrationNote", e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none"
                          placeholder="Additional information shown during registration"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="mt-6 bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-500" />
              Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Visibility */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Visibility</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => updateField("isPublished", e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-white">Published</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showOnHomepage}
                    onChange={(e) => updateField("showOnHomepage", e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-white">Show on Homepage</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => updateField("isFeatured", e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-white">Featured Event</span>
                </label>
              </div>

              {/* Type */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Event Type</h3>
                <select
                  value={formData.eventType}
                  onChange={(e) => updateField("eventType", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Contact Info</h3>
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => updateField("contactEmail", e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                      placeholder="contact@email.com"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => updateField("contactPhone", e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && !showPuckEditor && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Choose a Template</h2>
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {["event", "landing", "ministry", "about", "contact", "general"].map((category) => {
                const categoryTemplates = puckTemplates.filter(t => t.category === category);
                if (categoryTemplates.length === 0) return null;
                return (
                  <div key={category} className="mb-8">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                      {category.charAt(0).toUpperCase() + category.slice(1)} Pages
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {categoryTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleApplyTemplate(template)}
                          className="text-left p-4 bg-slate-700 border border-slate-600 rounded-xl hover:border-amber-500 hover:bg-slate-600 transition-colors group"
                        >
                          <div className="aspect-video bg-slate-600 rounded-lg mb-3 flex items-center justify-center">
                            <LayoutTemplate className="w-8 h-8 text-slate-400 group-hover:text-amber-500 transition-colors" />
                          </div>
                          <h4 className="font-semibold text-white mb-1 group-hover:text-amber-400">
                            {template.name}
                          </h4>
                          <p className="text-sm text-slate-400 line-clamp-2">
                            {template.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
