"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Mail,
  MessageSquare,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReferenceData } from "@/hooks/useReferenceData";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  startDate: string;
  status: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { churches, subDistricts } = useReferenceData();

  const [form, setForm] = useState({
    name: "",
    event: "",
    type: "sms" as "sms" | "email" | "both",
    subject: "",
    smsContent: "",
    emailContent: "",
    targetAudience: "all",
    frequency: "once",
    scheduledAt: "",
  });

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/payload-api/managed-events?limit=100&sort=-startDate&depth=0");
        if (res.ok) {
          const data = await res.json();
          setEvents(data.docs || []);
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
    }
    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        name: form.name,
        event: form.event,
        type: form.type,
        targetAudience: form.targetAudience,
        frequency: form.frequency,
        status: "draft",
      };

      if (form.type === "email" || form.type === "both") {
        body.subject = form.subject;
        body.emailContent = form.emailContent;
      }
      if (form.type === "sms" || form.type === "both") {
        body.smsContent = form.smsContent;
      }
      if (form.scheduledAt) {
        body.scheduledAt = form.scheduledAt;
        body.status = "scheduled";
      }

      const res = await fetch("/payload-api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push("/admin/campaigns");
      } else {
        const data = await res.json();
        setError(data.errors?.[0]?.message || data.message || "Failed to create campaign");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/campaigns">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Campaign</h1>
          <p className="text-slate-500">Set up a new SMS or email campaign</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., Event Reminder - Week 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event">Event *</Label>
              <select
                id="event"
                value={form.event}
                onChange={(e) => updateField("event", e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select an event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="both">Both SMS & Email</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <select
                id="targetAudience"
                value={form.targetAudience}
                onChange={(e) => updateField("targetAudience", e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="all">All Registered Guests</option>
                <option value="notAttended">Not Yet Attended</option>
                <option value="attended">Attended</option>
                <option value="notBaptized">Not Baptized</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <select
                id="frequency"
                value={form.frequency}
                onChange={(e) => updateField("frequency", e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="once">Send Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom Schedule</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Schedule (optional — leave empty for draft)</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => updateField("scheduledAt", e.target.value)}
            />
          </div>

          {/* Email fields */}
          {(form.type === "email" || form.type === "both") && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                Email Content
              </h3>
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  placeholder="e.g., You're Invited to {{event}}!"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailContent">Email Body (HTML)</Label>
                <p className="text-xs text-slate-500">
                  Placeholders: {"{{name}}, {{event}}, {{qrLink}}, {{eventDate}}, {{eventLocation}}"}
                </p>
                <textarea
                  id="emailContent"
                  value={form.emailContent}
                  onChange={(e) => updateField("emailContent", e.target.value)}
                  rows={8}
                  className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                  placeholder="<h2>Hello {{name}},</h2><p>Join us for {{event}} on {{eventDate}}!</p>"
                />
              </div>
            </div>
          )}

          {/* SMS fields */}
          {(form.type === "sms" || form.type === "both") && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                SMS Content
              </h3>
              <div className="space-y-2">
                <Label htmlFor="smsContent">SMS Message</Label>
                <p className="text-xs text-slate-500">
                  Placeholders: {"{{name}}, {{event}}, {{qrLink}}"}. Keep under 160 chars for best delivery.
                </p>
                <textarea
                  id="smsContent"
                  value={form.smsContent}
                  onChange={(e) => updateField("smsContent", e.target.value)}
                  rows={3}
                  maxLength={320}
                  className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                  placeholder="Hi {{name}}! Reminder: {{event}} is coming up. Your ticket: {{qrLink}}"
                />
                <p className="text-xs text-slate-400">{form.smsContent.length}/320 characters</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 border-t pt-6">
            <Button type="submit" disabled={saving || !form.name || !form.event}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save as {form.scheduledAt ? "Scheduled" : "Draft"}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/campaigns">Cancel</Link>
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
