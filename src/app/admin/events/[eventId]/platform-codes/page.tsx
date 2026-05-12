"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Download,
  Globe,
  BarChart3,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import QRCode from "qrcode";

interface PlatformLink {
  id: string;
  code: string;
  platform: string;
  customUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: "active" | "disabled";
  scanCount: number;
  registrationCount: number;
}

interface Platform {
  id: string;
  name: string;
  slug: string;
  iconIdentifier: string;
  color: string | null;
}

interface EventInfo {
  id: string;
  title: string;
  slug: string;
}

async function qrToBlob(url: string): Promise<Blob> {
  const dataUrl = await QRCode.toDataURL(url, {
    type: "image/png",
    width: 512,
    margin: 2,
    color: { dark: "#000000FF", light: "#FFFFFFFF" },
  });
  const res = await fetch(dataUrl);
  return await res.blob();
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 5000);
}

export default function PlatformCodesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [links, setLinks] = useState<PlatformLink[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [urlForm, setUrlForm] = useState("");
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/platform-event-links?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
        setPlatforms(data.platforms || []);
        setLinks(data.links || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getLink = (platformId: string): PlatformLink | undefined =>
    links.find((l) => l.platform === platformId);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://pmcc4thwatch.us";

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${baseUrl}/p/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleStatus = async (linkId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      const res = await fetch("/api/admin/platform-event-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: linkId, status: newStatus }),
      });
      if (res.ok) {
        setLinks((prev) =>
          prev.map((l) => (l.id === linkId ? { ...l, status: newStatus as "active" | "disabled" } : l))
        );
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const generateLinks = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/platform-event-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const result = await res.json();
      if (result.created > 0 || result.success) await fetchData();
    } catch (err) {
      console.error("Failed to generate links:", err);
    } finally {
      setGenerating(false);
    }
  };

  const saveCustomUrl = async (linkId: string) => {
    try {
      const res = await fetch("/api/admin/platform-event-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: linkId, customUrl: urlForm || null }),
      });
      if (res.ok) {
        setLinks((prev) =>
          prev.map((l) => (l.id === linkId ? { ...l, customUrl: urlForm || null } : l))
        );
        setEditingUrl(null);
      }
    } catch (err) {
      console.error("Failed to save URL:", err);
    }
  };

  const startEditContact = (link: PlatformLink) => {
    setContactForm({
      name: link.contactName || "",
      email: link.contactEmail || "",
      phone: link.contactPhone || "",
    });
    setEditingContact(link.id);
  };

  const saveContact = async (linkId: string) => {
    try {
      const res = await fetch("/api/admin/platform-event-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: linkId,
          contactName: contactForm.name || null,
          contactEmail: contactForm.email || null,
          contactPhone: contactForm.phone || null,
        }),
      });
      if (res.ok) {
        setLinks((prev) =>
          prev.map((l) =>
            l.id === linkId
              ? { ...l, contactName: contactForm.name, contactEmail: contactForm.email, contactPhone: contactForm.phone }
              : l
          )
        );
        setEditingContact(null);
      }
    } catch (err) {
      console.error("Failed to save contact:", err);
    }
  };

  const downloadQR = async (link: PlatformLink, platformName: string) => {
    const url = `${baseUrl}/p/${link.code}`;
    try {
      const blob = await qrToBlob(url);
      const safeName = platformName.replace(/[^a-zA-Z0-9]/g, "-");
      triggerDownload(blob, `qr-${safeName}.png`);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
    }
  };

  const downloadAllQR = async () => {
    for (const link of links) {
      const platform = platforms.find((p) => p.id === link.platform);
      if (platform && link.status === "active") {
        await downloadQR(link, platform.name);
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  };

  const activeCount = links.filter((l) => l.status === "active").length;
  const totalScans = links.reduce((sum, l) => sum + (l.scanCount || 0), 0);
  const totalRegs = links.reduce((sum, l) => sum + (l.registrationCount || 0), 0);

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
      <div className="flex items-center gap-3">
        <Link href={`/admin/events/${eventId}`} className="text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-900">Online Platform QR Codes</h1>
          <p className="text-sm text-slate-500">{event?.title}</p>
        </div>
      </div>

      {/* Stats + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="text-sm py-1 px-3">{links.length} links</Badge>
        <Badge variant="outline" className="text-sm py-1 px-3">{activeCount} active</Badge>
        <Badge variant="outline" className="text-sm py-1 px-3">{totalScans} scans</Badge>
        <Badge variant="outline" className="text-sm py-1 px-3">{totalRegs} registrations</Badge>
        <div className="ml-auto flex gap-2">
          {links.length > 0 && (
            <Button size="sm" variant="outline" onClick={downloadAllQR}>
              <Download className="w-4 h-4 mr-1" /> Download All QRs
            </Button>
          )}
          <Button size="sm" onClick={generateLinks} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Generate Missing
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/events/${eventId}/analytics`}>
              <BarChart3 className="w-4 h-4 mr-1" /> Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Platform Cards */}
      {platforms.length === 0 ? (
        <Card className="p-12 text-center">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">No Online Platforms Yet</h2>
          <p className="text-slate-500 text-sm mb-4">
            Set up online platforms first under Admin &gt; Online Platforms.
          </p>
          <Button asChild>
            <Link href="/admin/platforms">Go to Online Platforms</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const link = getLink(platform.id);
            const bgColor = platform.color || "#6B7280";

            return (
              <Card key={platform.id} className="overflow-hidden">
                {/* Platform header */}
                <div className="p-4 flex items-center gap-3" style={{ backgroundColor: bgColor + "10" }}>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: bgColor }}
                  >
                    {platform.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{platform.name}</p>
                    {link ? (
                      <div className="flex items-center gap-1">
                        <code className="text-xs font-mono text-slate-500">{link.code}</code>
                        <button onClick={() => copyLink(link.code)} className="text-slate-400 hover:text-slate-600">
                          {copiedCode === link.code ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No link generated</p>
                    )}
                  </div>
                  {link && (
                    <button onClick={() => toggleStatus(link.id, link.status)} title={link.status === "active" ? "Disable" : "Enable"}>
                      {link.status === "active" ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                    </button>
                  )}
                </div>

                {/* QR Code + Stats */}
                {link ? (
                  <div className="p-4 space-y-3">
                    {/* QR Code */}
                    <div className="flex justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${baseUrl}/p/${link.code}`)}`}
                        alt={`QR code for ${platform.name}`}
                        className="w-40 h-40"
                      />
                    </div>

                    {/* Short URL */}
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Short URL</p>
                      <p className="text-sm font-mono text-slate-700 select-all">{baseUrl}/p/{link.code}</p>
                    </div>

                    {/* Metrics */}
                    <div className="flex justify-center gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-slate-900">{link.scanCount || 0}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Scans</p>
                      </div>
                      <div className="w-px bg-slate-200" />
                      <div>
                        <p className="text-lg font-bold text-slate-900">{link.registrationCount || 0}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Regs</p>
                      </div>
                      <div className="w-px bg-slate-200" />
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {link.scanCount > 0 ? ((link.registrationCount / link.scanCount) * 100).toFixed(1) : "0"}%
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Conv.</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => downloadQR(link, platform.name)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> QR
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => { setEditingUrl(link.id); setUrlForm(link.customUrl || ""); }}
                      >
                        Edit URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditContact(link)}
                        title="Edit contact"
                      >
                        <User className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Custom URL indicator */}
                    {link.customUrl && (
                      <p className="text-xs text-slate-400 truncate text-center" title={link.customUrl}>
                        Redirects to: {link.customUrl}
                      </p>
                    )}

                    {/* Contact info */}
                    {link.contactName && (
                      <div className="text-xs text-slate-400 text-center">
                        Contact: {link.contactName}
                        {link.contactPhone && <> &middot; {link.contactPhone}</>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400 text-sm">
                    Click "Generate Missing" to create a link
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Custom URL Modal */}
      {editingUrl && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditingUrl(null)}>
          <Card className="w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">Edit Custom Redirect URL</h3>
            <p className="text-sm text-slate-500">
              Override the default redirect (registration page). Leave blank to use the default.
            </p>
            <div>
              <label className="text-sm text-slate-500 mb-1 block">Custom URL</label>
              <Input
                value={urlForm}
                onChange={(e) => setUrlForm(e.target.value)}
                placeholder="https://example.com/custom-page"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveCustomUrl(editingUrl)}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditingUrl(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditingContact(null)}>
          <Card className="w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">Edit Contact</h3>
            <p className="text-sm text-slate-500">
              Contact details shown on the registration page for this platform link.
            </p>
            <div>
              <label className="text-sm text-slate-500 mb-1 block">Name</label>
              <Input value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contact person name" />
            </div>
            <div>
              <label className="text-sm text-slate-500 mb-1 block">Email</label>
              <Input value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} placeholder="contact@email.com" />
            </div>
            <div>
              <label className="text-sm text-slate-500 mb-1 block">Phone</label>
              <Input value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 555-000-0000" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveContact(editingContact)}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditingContact(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
