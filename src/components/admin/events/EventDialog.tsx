"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  // Basic Info
  title: string;
  slug: string;
  description: string;

  // Schedule & Location
  startDate: string;
  endDate: string;
  location: string;
  address: string;

  // Registration Settings
  registrationEnabled: boolean;
  registrationDeadline: string;
  maxAttendees: string;
  hasBaptism: boolean;
  requireApproval: boolean;

  // Status
  status: string;

  // Image
  heroImage: string | null;
}

const initialFormData: FormData = {
  title: "",
  slug: "",
  description: "",
  startDate: "",
  endDate: "",
  location: "",
  address: "",
  registrationEnabled: true,
  registrationDeadline: "",
  maxAttendees: "",
  hasBaptism: false,
  requireApproval: false,
  status: "draft",
  heroImage: null,
};

export function EventDialog({ open, onOpenChange, onSuccess }: EventDialogProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof FormData, value: string | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (value: string) => {
    updateField("title", value);
    if (!formData.slug || formData.slug === generateSlug(formData.title)) {
      updateField("slug", generateSlug(value));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (goToDetail = false) => {
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/managed-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees, 10) : null,
          heroImage: formData.heroImage || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event");
      }

      const event = await res.json();

      // Reset form
      setFormData(initialFormData);
      setActiveTab("basic");
      setHeroImagePreview(null);

      if (goToDetail) {
        router.push(`/admin/events/${event.id}`);
      } else {
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      setErrors({ form: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new event. You can edit it later.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Summer Crusade 2024"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="summer-crusade-2024"
                className={errors.slug ? "border-red-500" : ""}
              />
              <p className="text-xs text-slate-500">
                URL-friendly identifier for registration links
              </p>
              {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Brief description of the event..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="registration-open">Open for Registration</option>
                <option value="registration-closed">Registration Closed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </TabsContent>

          {/* Schedule & Location Tab */}
          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date & Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className={errors.startDate ? "border-red-500" : ""}
              />
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date & Time</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="e.g., PMCC Main Sanctuary"
                className={errors.location ? "border-red-500" : ""}
              />
              {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Full address of the venue..."
                rows={2}
              />
            </div>
          </TabsContent>

          {/* Registration Tab */}
          <TabsContent value="registration" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="registrationEnabled">Enable Registration</Label>
              <input
                id="registrationEnabled"
                type="checkbox"
                checked={formData.registrationEnabled}
                onChange={(e) => updateField("registrationEnabled", e.target.checked)}
                className="w-4 h-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationDeadline">Registration Deadline</Label>
              <Input
                id="registrationDeadline"
                type="datetime-local"
                value={formData.registrationDeadline}
                onChange={(e) => updateField("registrationDeadline", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => updateField("maxAttendees", e.target.value)}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="hasBaptism">Include Baptism</Label>
              <input
                id="hasBaptism"
                type="checkbox"
                checked={formData.hasBaptism}
                onChange={(e) => updateField("hasBaptism", e.target.checked)}
                className="w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requireApproval">Require Approval</Label>
              <input
                id="requireApproval"
                type="checkbox"
                checked={formData.requireApproval}
                onChange={(e) => updateField("requireApproval", e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </TabsContent>

          {/* Image Tab */}
          <TabsContent value="image" className="space-y-4 mt-4">
            <ImageUploadField
              value={formData.heroImage}
              onChange={(value) => updateField("heroImage", value as string | null)}
              label="Hero Image"
            />
            <p className="text-xs text-slate-500">
              Recommended: 1920x1080px for best display on the registration page
            </p>
          </TabsContent>
        </Tabs>

        {errors.form && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.form}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create & Add More
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create & Go to Detail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
