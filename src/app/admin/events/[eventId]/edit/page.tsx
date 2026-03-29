"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  MapPin,
  Settings,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

interface EventData {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location: string;
  address: string;
  coordinates?: { lat?: number; lng?: number };
  registrationEnabled: boolean;
  registrationDeadline: string;
  maxAttendees: number | null;
  hasBaptism: boolean;
  requireApproval: boolean;
  heroImage: string | null;
  landingPageHeroImage: string | null;
  landingPageTitle: string;
  landingPageShowQR: boolean;
  landingPageShowInviter: boolean;
  landingPageCTA: string;
  landingPageCTALink: string;
  thankYouTitle: string;
  checkInEnabled: boolean;
  allowMultipleCheckIns: boolean;
  organizer: string | null;
}

// For heroImage/landingPageHeroImage, we need to resolve the URL from populated upload data
interface EventResponse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: string;
  eventType?: string;
  startDate: string;
  endDate?: string;
  location: string;
  address?: string;
  coordinates?: { lat?: number; lng?: number };
  registrationEnabled?: boolean;
  registrationDeadline?: string;
  maxAttendees?: number | null;
  hasBaptism?: boolean;
  requireApproval?: boolean;
  heroImage?: { id: string; url?: string } | string | null;
  landingPageHeroImage?: { id: string; url?: string } | string | null;
  landingPageTitle?: string;
  landingPageShowQR?: boolean;
  landingPageShowInviter?: boolean;
  landingPageCTA?: string;
  landingPageCTALink?: string;
  thankYouTitle?: string;
  checkInEnabled?: boolean;
  allowMultipleCheckIns?: boolean;
  organizer?: { id: string } | string | null;
}

function resolveMediaId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "id" in value) {
    return (value as { id: string }).id;
  }
  return null;
}

function resolveMediaUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "url" in value) {
    const url = (value as { url?: string }).url;
    if (url) {
      const base = process.env.NEXT_PUBLIC_SERVER_URL || "";
      return url.startsWith("http") ? url : `${base}${url}`;
    }
  }
  return null;
}

/** Format a date string as YYYY-MM-DDTHH:mm using local time components (for datetime-local inputs). */
function toLocalDatetimeString(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [formData, setFormData] = useState<EventData | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [landingImagePreview, setLandingImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/managed-events/${eventId}`);
      if (!res.ok) {
        router.push("/admin/events");
        return;
      }
      const data: EventResponse = await res.json();

      const heroId = resolveMediaId(data.heroImage);
      const landingId = resolveMediaId(data.landingPageHeroImage);

      setFormData({
        id: data.id,
        title: data.title || "",
        slug: data.slug || "",
        description: data.description || "",
        status: data.status || "draft",
        eventType: data.eventType || "general",
        startDate: toLocalDatetimeString(data.startDate),
        endDate: toLocalDatetimeString(data.endDate),
        location: data.location || "",
        address: data.address || "",
        coordinates: data.coordinates,
        registrationEnabled: data.registrationEnabled ?? true,
        registrationDeadline: toLocalDatetimeString(data.registrationDeadline),
        maxAttendees: data.maxAttendees ?? null,
        hasBaptism: data.hasBaptism ?? false,
        requireApproval: data.requireApproval ?? false,
        heroImage: heroId,
        landingPageHeroImage: landingId,
        landingPageTitle: data.landingPageTitle || "You're Registered!",
        landingPageShowQR: data.landingPageShowQR ?? true,
        landingPageShowInviter: data.landingPageShowInviter ?? true,
        landingPageCTA: data.landingPageCTA || "",
        landingPageCTALink: data.landingPageCTALink || "",
        thankYouTitle: data.thankYouTitle || "Thank You for Registering!",
        checkInEnabled: data.checkInEnabled ?? true,
        allowMultipleCheckIns: data.allowMultipleCheckIns ?? false,
        organizer: typeof data.organizer === "string" ? data.organizer : data.organizer?.id || null,
      });

      setHeroImagePreview(resolveMediaUrl(data.heroImage));
      setLandingImagePreview(resolveMediaUrl(data.landingPageHeroImage));
    } catch {
      router.push("/admin/events");
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const updateField = (field: keyof EventData, value: string | boolean | number | null) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    if (!formData) return false;
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !formData) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      const body: Record<string, unknown> = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description || undefined,
        status: formData.status,
        eventType: formData.eventType || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || null,
        location: formData.location,
        address: formData.address || undefined,
        registrationEnabled: formData.registrationEnabled,
        registrationDeadline: formData.registrationDeadline || null,
        maxAttendees: formData.maxAttendees ?? null,
        hasBaptism: formData.hasBaptism,
        requireApproval: formData.requireApproval,
        heroImage: formData.heroImage || null,
        landingPageHeroImage: formData.landingPageHeroImage || null,
        landingPageTitle: formData.landingPageTitle || undefined,
        landingPageShowQR: formData.landingPageShowQR,
        landingPageShowInviter: formData.landingPageShowInviter,
        landingPageCTA: formData.landingPageCTA || undefined,
        landingPageCTALink: formData.landingPageCTALink || undefined,
        thankYouTitle: formData.thankYouTitle || undefined,
        checkInEnabled: formData.checkInEnabled,
        allowMultipleCheckIns: formData.allowMultipleCheckIns,
        organizer: formData.organizer || undefined,
      };

      const res = await fetch(`/api/managed-events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update event");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setErrors({ form: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/events/${eventId}`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Event</h1>
            <p className="text-slate-500 text-sm">{formData.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" /> Saved
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-white p-6">
        <Tabs defaultValue="basic">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="basic" className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Basic Info
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Location
            </TabsTrigger>
            <TabsTrigger value="registration" className="flex items-center gap-1.5">
              <Settings className="w-4 h-4" /> Registration
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> Images
            </TabsTrigger>
            <TabsTrigger value="landing" className="flex items-center gap-1.5">
              <Settings className="w-4 h-4" /> Landing Page
            </TabsTrigger>
            <TabsTrigger value="checkin" className="flex items-center gap-1.5">
              <Settings className="w-4 h-4" /> Check-In
            </TabsTrigger>
          </TabsList>

          {/* Basic Info */}
          <TabsContent value="basic" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={formData.title} onChange={(e) => updateField("title", e.target.value)} className={errors.title ? "border-red-500" : ""} />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={formData.slug} onChange={(e) => updateField("slug", e.target.value)} className={errors.slug ? "border-red-500" : ""} />
                {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} rows={4} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={formData.status} onChange={(e) => updateField("status", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="draft">Draft</option>
                  <option value="registration-open">Open for Registration</option>
                  <option value="registration-closed">Registration Closed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Event Type</Label>
                <select value={formData.eventType} onChange={(e) => updateField("eventType", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="general">General Event</option>
                  <option value="crusade">Crusade</option>
                  <option value="conference">Conference</option>
                  <option value="training">Training</option>
                  <option value="worship">Worship Service</option>
                  <option value="youth">Youth Event</option>
                  <option value="baptism">Baptism</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date & Time *</Label>
                <Input type="datetime-local" value={formData.startDate} onChange={(e) => updateField("startDate", e.target.value)} className={errors.startDate ? "border-red-500" : ""} />
                {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
              </div>
              <div className="space-y-2">
                <Label>End Date & Time</Label>
                <Input type="datetime-local" value={formData.endDate} onChange={(e) => updateField("endDate", e.target.value)} />
              </div>
            </div>
          </TabsContent>

          {/* Location */}
          <TabsContent value="location" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input value={formData.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Venue name" className={errors.location ? "border-red-500" : ""} />
              {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={formData.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Full address" rows={2} />
            </div>
          </TabsContent>

          {/* Registration Settings */}
          <TabsContent value="registration" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <Label>Enable Registration</Label>
              <input type="checkbox" checked={formData.registrationEnabled} onChange={(e) => updateField("registrationEnabled", e.target.checked)} className="w-4 h-4" />
            </div>
            <div className="space-y-2">
              <Label>Registration Deadline</Label>
              <Input type="datetime-local" value={formData.registrationDeadline} onChange={(e) => updateField("registrationDeadline", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Max Attendees</Label>
              <Input type="number" value={formData.maxAttendees ?? ""} onChange={(e) => updateField("maxAttendees", e.target.value ? parseInt(e.target.value, 10) : null)} placeholder="Leave empty for unlimited" min="1" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Include Baptism</Label>
              <input type="checkbox" checked={formData.hasBaptism} onChange={(e) => updateField("hasBaptism", e.target.checked)} className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Approval</Label>
              <input type="checkbox" checked={formData.requireApproval} onChange={(e) => updateField("requireApproval", e.target.checked)} className="w-4 h-4" />
            </div>
          </TabsContent>

          {/* Images */}
          <TabsContent value="images" className="space-y-6 mt-6">
            <ImageUploadField
              value={formData.heroImage}
              onChange={(value, url) => {
                updateField("heroImage", value);
                setHeroImagePreview(url !== undefined ? url : (value === null ? null : heroImagePreview));
              }}
              previewUrl={heroImagePreview}
              label="Hero Image (Registration Page)"
            />
            <p className="text-xs text-slate-500">Recommended: 1920x1080px. Displayed at the top of the guest registration page.</p>

            <ImageUploadField
              value={formData.landingPageHeroImage}
              onChange={(value, url) => {
                updateField("landingPageHeroImage", value);
                setLandingImagePreview(url !== undefined ? url : (value === null ? null : landingImagePreview));
              }}
              previewUrl={landingImagePreview}
              label="Thank You Page Hero Image"
            />
            <p className="text-xs text-slate-500">Displayed on the post-registration confirmation page.</p>
          </TabsContent>

          {/* Landing Page / Thank You */}
          <TabsContent value="landing" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Thank You Title</Label>
              <Input value={formData.thankYouTitle} onChange={(e) => updateField("thankYouTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Landing Page Title</Label>
              <Input value={formData.landingPageTitle} onChange={(e) => updateField("landingPageTitle", e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show QR Code on Landing Page</Label>
              <input type="checkbox" checked={formData.landingPageShowQR} onChange={(e) => updateField("landingPageShowQR", e.target.checked)} className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Inviter Info on Landing Page</Label>
              <input type="checkbox" checked={formData.landingPageShowInviter} onChange={(e) => updateField("landingPageShowInviter", e.target.checked)} className="w-4 h-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTA Button Text</Label>
                <Input value={formData.landingPageCTA} onChange={(e) => updateField("landingPageCTA", e.target.value)} placeholder="e.g., Learn More" />
              </div>
              <div className="space-y-2">
                <Label>CTA Button Link</Label>
                <Input value={formData.landingPageCTALink} onChange={(e) => updateField("landingPageCTALink", e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </TabsContent>

          {/* Check-In Settings */}
          <TabsContent value="checkin" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <Label>Enable QR Check-In</Label>
              <input type="checkbox" checked={formData.checkInEnabled} onChange={(e) => updateField("checkInEnabled", e.target.checked)} className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Allow Multiple Check-Ins</Label>
              <input type="checkbox" checked={formData.allowMultipleCheckIns} onChange={(e) => updateField("allowMultipleCheckIns", e.target.checked)} className="w-4 h-4" />
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errors.form}
        </div>
      )}
    </div>
  );
}
