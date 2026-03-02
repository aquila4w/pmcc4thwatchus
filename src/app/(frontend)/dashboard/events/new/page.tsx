"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  Save,
  Image,
  MapPin,
  Clock,
  Users,
  Settings,
  FileText,
  Loader2,
  Plus,
  X,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface EventFormData {
  title: string;
  slug: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  address: string;
  status: "draft" | "published";
  requiresRegistration: boolean;
  registrationDeadline: string;
  maxAttendees: number | "";
  hasBaptism: boolean;
  thankYouTitle: string;
  thankYouMessage: string;
  categories: string[];
  featuredImage: string;
}

const categoryOptions = [
  { id: "crusade", label: "Crusade" },
  { id: "worship", label: "Worship" },
  { id: "fellowship", label: "Fellowship" },
  { id: "training", label: "Training" },
  { id: "youth", label: "Youth" },
  { id: "prayer", label: "Prayer" },
  { id: "baptism", label: "Baptism" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    slug: "",
    description: "",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "17:00",
    location: "",
    address: "",
    status: "draft",
    requiresRegistration: true,
    registrationDeadline: "",
    maxAttendees: "",
    hasBaptism: false,
    thankYouTitle: "Thank You for Registering!",
    thankYouMessage: "We're excited to have you join us. You'll receive a confirmation email with your QR code shortly.",
    categories: [],
    featuredImage: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Auto-generate slug from title
    if (name === "title") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Combine date and time
      const startDateTime = `${formData.startDate}T${formData.startTime}:00`;
      const endDateTime = formData.endDate
        ? `${formData.endDate}T${formData.endTime}:00`
        : `${formData.startDate}T${formData.endTime}:00`;

      const eventData = {
        ...formData,
        startDate: startDateTime,
        endDate: endDateTime,
      };

      // TODO: Submit to Payload CMS API
      console.log("Event data to submit:", eventData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      router.push("/admin/events");
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/events">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold">Create Event</h1>
                <p className="text-sm text-muted-foreground">Add a new event to your calendar</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard/events">Cancel</Link>
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving || !formData.title || !formData.startDate}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Event
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Spiritual Empowerment Conference"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-muted-foreground mr-2">/events/</span>
                      <Input
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder="event-slug"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your event..."
                      className="mt-1 min-h-[120px]"
                    />
                  </div>
                </div>
              </Card>

              {/* Schedule */}
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Schedule
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="Same as start date if empty"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </Card>

              {/* Location */}
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Location
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location">Venue Name</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Los Angeles Convention Center"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Full Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main St, Los Angeles, CA 90001"
                      className="mt-1"
                    />
                  </div>
                </div>
              </Card>

              {/* Registration Settings */}
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Registration Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="requiresRegistration"
                      name="requiresRegistration"
                      checked={formData.requiresRegistration}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="requiresRegistration" className="cursor-pointer">
                      Require registration for this event
                    </Label>
                  </div>

                  {formData.requiresRegistration && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                          <Input
                            id="registrationDeadline"
                            name="registrationDeadline"
                            type="date"
                            value={formData.registrationDeadline}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxAttendees">Maximum Attendees</Label>
                          <Input
                            id="maxAttendees"
                            name="maxAttendees"
                            type="number"
                            value={formData.maxAttendees}
                            onChange={handleInputChange}
                            placeholder="Leave empty for unlimited"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <input
                          type="checkbox"
                          id="hasBaptism"
                          name="hasBaptism"
                          checked={formData.hasBaptism}
                          onChange={handleInputChange}
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="hasBaptism" className="cursor-pointer">
                          This event includes a baptism ceremony
                        </Label>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Thank You Page */}
              {formData.requiresRegistration && (
                <Card className="p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Thank You Page
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Customize the message shown to guests after they register.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="thankYouTitle">Title</Label>
                      <Input
                        id="thankYouTitle"
                        name="thankYouTitle"
                        value={formData.thankYouTitle}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="thankYouMessage">Message</Label>
                      <Textarea
                        id="thankYouMessage"
                        name="thankYouMessage"
                        value={formData.thankYouMessage}
                        onChange={handleInputChange}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4">Status</h2>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <p className="text-sm text-muted-foreground mt-2">
                  {formData.status === "draft"
                    ? "This event is not visible to the public."
                    : "This event is visible and accepting registrations."}
                </p>
              </Card>

              {/* Featured Image */}
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4">Featured Image</h2>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </Card>

              {/* Categories */}
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4">Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        formData.categories.includes(category.id)
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-slate-600 border-slate-200 hover:border-primary"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Summary */}
              <Card className="p-6 bg-slate-50">
                <h2 className="font-semibold text-lg mb-4">Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={formData.status === "published" ? "default" : "secondary"}>
                      {formData.status}
                    </Badge>
                  </div>
                  {formData.startDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">
                        {new Date(formData.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registration</span>
                    <span className="font-medium">
                      {formData.requiresRegistration ? "Required" : "Not required"}
                    </span>
                  </div>
                  {formData.hasBaptism && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Baptism</span>
                      <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                        Included
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
