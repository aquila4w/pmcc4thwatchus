"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Save,
  Send,
  Mail,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  Eye,
  Loader2,
  Info,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface CampaignFormData {
  name: string;
  event: string;
  type: "sms" | "email" | "both";
  subject: string;
  smsContent: string;
  emailContent: string;
  frequency: "once" | "daily" | "weekly" | "custom";
  scheduledDate: string;
  scheduledTime: string;
  targetAudience: "all" | "notAttended" | "attended" | "notBaptized";
}

const events = [
  { id: "evt-001", title: "Spiritual Empowerment Day 1", registrations: 156 },
  { id: "evt-002", title: "Soul Winning Summit", registrations: 89 },
  { id: "evt-003", title: "Apostolic Soul Winning", registrations: 45 },
  { id: "evt-004", title: "Youth Fellowship Night", registrations: 32 },
];

const placeholders = [
  { tag: "{{name}}", description: "Guest's full name" },
  { tag: "{{event}}", description: "Event title" },
  { tag: "{{eventDate}}", description: "Event date" },
  { tag: "{{eventTime}}", description: "Event time" },
  { tag: "{{eventLocation}}", description: "Event location" },
  { tag: "{{qrLink}}", description: "Link to QR code" },
  { tag: "{{inviteCode}}", description: "Invite code" },
];

const emailTemplates = [
  {
    name: "Event Reminder",
    subject: "Reminder: {{event}} is Coming Up!",
    content: `Hi {{name}},

This is a friendly reminder that {{event}} is happening on {{eventDate}} at {{eventTime}}.

Location: {{eventLocation}}

Don't forget to bring your QR code for check-in: {{qrLink}}

We're excited to see you there!

Blessings,
PMCC 4th Watch Team`,
  },
  {
    name: "Registration Confirmation",
    subject: "You're Registered for {{event}}!",
    content: `Hi {{name}},

Thank you for registering for {{event}}!

Event Details:
- Date: {{eventDate}}
- Time: {{eventTime}}
- Location: {{eventLocation}}

Your QR Code: {{qrLink}}
Your Invite Code: {{inviteCode}}

Please save this email and bring your QR code for check-in.

See you there!

PMCC 4th Watch Team`,
  },
  {
    name: "Thank You",
    subject: "Thank You for Attending {{event}}",
    content: `Hi {{name}},

Thank you for joining us at {{event}}!

We hope you were blessed and encouraged. We'd love to have you join us again at future events.

Stay connected with PMCC 4th Watch:
- Visit our website: pmcc4thwatch.us
- Follow us on Facebook: @pmcc4thwatchusdistrict

God bless!

PMCC 4th Watch Team`,
  },
];

const smsTemplates = [
  {
    name: "Event Reminder",
    content: "Hi {{name}}! Reminder: {{event}} is on {{eventDate}} at {{eventTime}}. See you there! - PMCC 4th Watch",
  },
  {
    name: "Day Before",
    content: "Hi {{name}}! {{event}} is TOMORROW! Don't forget your QR code. Location: {{eventLocation}}. See you soon!",
  },
  {
    name: "Thank You",
    content: "Hi {{name}}! Thank you for attending {{event}}. We hope you were blessed! Visit pmcc4thwatch.us for more events.",
  },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    event: "",
    type: "both",
    subject: "",
    smsContent: "",
    emailContent: "",
    frequency: "once",
    scheduledDate: "",
    scheduledTime: "09:00",
    targetAudience: "all",
  });

  const selectedEvent = events.find(e => e.id === formData.event);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const applyEmailTemplate = (template: typeof emailTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      emailContent: template.content,
    }));
  };

  const applySmsTemplate = (template: typeof smsTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      smsContent: template.content,
    }));
  };

  const insertPlaceholder = (field: "smsContent" | "emailContent", placeholder: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] + placeholder,
    }));
  };

  const handleSubmit = async (action: "save" | "schedule") => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push("/admin/campaigns");
    } catch (error) {
      console.error("Error saving campaign:", error);
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
                <Link href="/dashboard/campaigns">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold">Create Campaign</h1>
                <p className="text-sm text-muted-foreground">Set up SMS or email campaign</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => handleSubmit("save")} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={() => handleSubmit("schedule")} disabled={saving || !formData.event}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Schedule Campaign
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4">Campaign Details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Event Reminder - 1 Week Before"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="event">Select Event *</Label>
                  <select
                    id="event"
                    name="event"
                    value={formData.event}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="">Choose an event...</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({event.registrations} registrations)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Campaign Type</Label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { value: "both", label: "SMS + Email", icon: <><MessageSquare className="w-4 h-4" /><Mail className="w-4 h-4" /></> },
                      { value: "email", label: "Email Only", icon: <Mail className="w-4 h-4" /> },
                      { value: "sms", label: "SMS Only", icon: <MessageSquare className="w-4 h-4" /> },
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: option.value as "sms" | "email" | "both" }))}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                          formData.type === option.value
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-slate-600 border-slate-200 hover:border-primary"
                        }`}
                      >
                        {option.icon}
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Message Content */}
            <Card className="p-6">
              <Tabs defaultValue="email">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">Message Content</h2>
                  <TabsList>
                    {(formData.type === "email" || formData.type === "both") && (
                      <TabsTrigger value="email">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </TabsTrigger>
                    )}
                    {(formData.type === "sms" || formData.type === "both") && (
                      <TabsTrigger value="sms">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        SMS
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>

                <TabsContent value="email" className="space-y-4">
                  {/* Quick Templates */}
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Quick Templates</Label>
                    <div className="flex gap-2 flex-wrap">
                      {emailTemplates.map(template => (
                        <Button
                          key={template.name}
                          variant="outline"
                          size="sm"
                          onClick={() => applyEmailTemplate(template)}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="e.g., Reminder: {{event}} is Coming Up!"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emailContent">Email Body</Label>
                    <Textarea
                      id="emailContent"
                      name="emailContent"
                      value={formData.emailContent}
                      onChange={handleInputChange}
                      placeholder="Write your email content here..."
                      className="mt-1 min-h-[250px] font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="sms" className="space-y-4">
                  {/* Quick Templates */}
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Quick Templates</Label>
                    <div className="flex gap-2 flex-wrap">
                      {smsTemplates.map(template => (
                        <Button
                          key={template.name}
                          variant="outline"
                          size="sm"
                          onClick={() => applySmsTemplate(template)}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="smsContent">SMS Message</Label>
                      <span className={`text-xs ${formData.smsContent.length > 160 ? "text-orange-500" : "text-muted-foreground"}`}>
                        {formData.smsContent.length}/160 characters
                      </span>
                    </div>
                    <Textarea
                      id="smsContent"
                      name="smsContent"
                      value={formData.smsContent}
                      onChange={handleInputChange}
                      placeholder="Write your SMS message here..."
                      className="mt-1 min-h-[120px]"
                      maxLength={320}
                    />
                    {formData.smsContent.length > 160 && (
                      <p className="text-xs text-orange-500 mt-1">
                        This message will be sent as {Math.ceil(formData.smsContent.length / 160)} SMS segments
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Schedule */}
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4">Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <select
                    id="frequency"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="once">Send Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom Schedule</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="scheduledDate">Send Date</Label>
                  <Input
                    id="scheduledDate"
                    name="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledTime">Send Time</Label>
                  <Input
                    id="scheduledTime"
                    name="scheduledTime"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Target Audience */}
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Target Audience
              </h2>
              <div className="space-y-2">
                {[
                  { value: "all", label: "All Registered Guests" },
                  { value: "notAttended", label: "Not Yet Attended" },
                  { value: "attended", label: "Attended" },
                  { value: "notBaptized", label: "Not Baptized" },
                ].map(option => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.targetAudience === option.value
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetAudience"
                      value={option.value}
                      checked={formData.targetAudience === option.value}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>

              {selectedEvent && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium">Estimated Recipients</p>
                  <p className="text-2xl font-bold text-primary">{selectedEvent.registrations}</p>
                </div>
              )}
            </Card>

            {/* Placeholders */}
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Available Placeholders
              </h2>
              <div className="space-y-2">
                {placeholders.map(placeholder => (
                  <div
                    key={placeholder.tag}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm"
                  >
                    <code className="text-primary font-mono text-xs">{placeholder.tag}</code>
                    <span className="text-muted-foreground text-xs">{placeholder.description}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Preview */}
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Preview
              </h2>
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Preview Message
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                See how your message will look to recipients
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
