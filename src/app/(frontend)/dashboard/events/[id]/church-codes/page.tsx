"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  User,
  Mail,
  Phone,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ChurchInvite {
  id: string;
  code: string;
  church: string;
  adPlacement: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactMember?: string;
  status: "active" | "disabled";
  scanCount: number;
  registrationCount: number;
}

interface Church { id: string; name: string }
interface Placement { id: string; name: string }

export default function ChurchCodesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("");
  const [eventSlug, setEventSlug] = useState("");
  const [churches, setChurches] = useState<Church[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [invites, setInvites] = useState<ChurchInvite[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventRes, churchesRes, placementsRes, invitesRes] = await Promise.all([
        fetch(`/payload-api/managed-events/${eventId}?depth=0`, { credentials: "include" }),
        fetch("/payload-api/churches?limit=200&sort=name&depth=0", { credentials: "include" }),
        fetch("/payload-api/ad-placements?limit=100&sort=name&where[status][equals]=active&depth=0", { credentials: "include" }),
        fetch(`/payload-api/church-event-invites?limit=500&where[event][equals]=${eventId}&depth=0`, { credentials: "include" }),
      ]);

      const eventData = await eventRes.json();
      const churchesData = await churchesRes.json();
      const placementsData = await placementsRes.json();
      const invitesData = await invitesRes.json();

      setEventTitle(eventData.title || "");
      setEventSlug(eventData.slug || "");
      setChurches(churchesData.docs || []);
      setPlacements(placementsData.docs || []);
      setInvites(invitesData.docs || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getInvite = (churchId: string, placementId: string): ChurchInvite | undefined =>
    invites.find((i) => i.church === churchId && i.adPlacement === placementId);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://pmcc4thwatch.us";

  const copyLink = (code: string) => {
    const url = `${baseUrl}/register/${eventSlug}?ad=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleStatus = async (inviteId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      await fetch(`/payload-api/church-event-invites/${inviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      setInvites((prev) =>
        prev.map((i) => (i.id === inviteId ? { ...i, status: newStatus as "active" | "disabled" } : i))
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const generateCodes = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/church-invites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ eventId }),
      });
      const result = await res.json();
      if (result.created > 0) {
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to generate codes:", err);
    } finally {
      setGenerating(false);
    }
  };

  const saveContact = async (inviteId: string) => {
    try {
      await fetch(`/payload-api/church-event-invites/${inviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contactName: contactForm.name || undefined,
          contactEmail: contactForm.email || undefined,
          contactPhone: contactForm.phone || undefined,
        }),
      });
      setInvites((prev) =>
        prev.map((i) =>
          i.id === inviteId
            ? { ...i, contactName: contactForm.name, contactEmail: contactForm.email, contactPhone: contactForm.phone }
            : i
        )
      );
      setEditingContact(null);
    } catch (err) {
      console.error("Failed to save contact:", err);
    }
  };

  const applyContactToAll = async (churchId: string) => {
    const churchInvites = invites.filter((i) => i.church === churchId);
    const firstInvite = churchInvites[0];
    if (!firstInvite) return;

    const contactData = {
      contactName: firstInvite.contactName || undefined,
      contactEmail: firstInvite.contactEmail || undefined,
      contactPhone: firstInvite.contactPhone || undefined,
    };

    try {
      await Promise.all(
        churchInvites.map((i) =>
          fetch(`/payload-api/church-event-invites/${i.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(contactData),
          })
        )
      );
      // Refresh all invites
      const res = await fetch(`/payload-api/church-event-invites?limit=500&where[event][equals]=${eventId}&depth=0`, { credentials: "include" });
      const data = await res.json();
      setInvites(data.docs || []);
    } catch (err) {
      console.error("Failed to apply contact:", err);
    }
  };

  const startEditContact = (invite: ChurchInvite) => {
    setEditingContact(invite.id);
    setContactForm({
      name: invite.contactName || "",
      email: invite.contactEmail || "",
      phone: invite.contactPhone || "",
    });
  };

  const activeCount = invites.filter((i) => i.status === "active").length;
  const totalScans = invites.reduce((sum, i) => sum + (i.scanCount || 0), 0);
  const totalRegs = invites.reduce((sum, i) => sum + (i.registrationCount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard/events" className="text-slate-400 hover:text-slate-600">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Church QR Codes</h1>
              <p className="text-sm text-slate-500">{eventTitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            <Badge variant="outline" className="text-sm py-1 px-3">
              {invites.length} codes
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              {activeCount} active
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              {totalScans} scans
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              {totalRegs} registrations
            </Badge>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={generateCodes} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              Generate Missing
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/events/${eventId}/analytics`}>
                <ExternalLink className="w-4 h-4 mr-1" /> View Analytics
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {churches.length === 0 || placements.length === 0 ? (
          <Card className="p-12 text-center">
            <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-700 mb-2">
              {placements.length === 0 ? "No Ad Placements Yet" : "No Churches Yet"}
            </h2>
            <p className="text-slate-500 text-sm">
              {placements.length === 0
                ? "Create ad placements first, then codes will auto-generate."
                : "Churches are synced from the organization setup."}
            </p>
          </Card>
        ) : (
          /* Matrix: rows = churches, columns = placements */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500 border-b sticky left-0 bg-slate-50 z-10 min-w-[200px]">
                    Church
                  </th>
                  {placements.map((p) => (
                    <th key={p.id} className="text-center px-3 py-3 text-sm font-medium text-slate-500 border-b min-w-[180px]">
                      {p.name}
                    </th>
                  ))}
                  <th className="px-3 py-3 border-b min-w-[100px]" />
                </tr>
              </thead>
              <tbody>
                {churches.map((church) => {
                  const churchInvites = invites.filter((i) => i.church === church.id);
                  const firstContact = churchInvites[0];

                  return (
                    <tr key={church.id} className="border-b hover:bg-slate-50/50">
                      <td className="px-4 py-3 sticky left-0 bg-white z-10">
                        <p className="font-medium text-slate-900 text-sm">{church.name}</p>
                        {firstContact?.contactName && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Contact: {firstContact.contactName}
                            {firstContact.contactPhone && ` · ${firstContact.contactPhone}`}
                          </p>
                        )}
                      </td>
                      {placements.map((placement) => {
                        const invite = getInvite(church.id, placement.id);
                        if (!invite) {
                          return (
                            <td key={placement.id} className="px-3 py-3 text-center text-slate-300 text-xs">
                              —
                            </td>
                          );
                        }

                        const isEditing = editingContact === invite.id;

                        return (
                          <td key={placement.id} className="px-3 py-2">
                            <div className={`rounded-lg border p-2 text-center space-y-1.5 ${
                              invite.status === "active"
                                ? "border-slate-200 bg-white"
                                : "border-slate-200 bg-slate-50 opacity-60"
                            }`}>
                              <div className="flex items-center justify-center gap-1">
                                <code className="text-xs font-mono font-bold text-slate-700">{invite.code}</code>
                                <button
                                  onClick={() => copyLink(invite.code)}
                                  className="text-slate-400 hover:text-slate-600"
                                  title="Copy invite link"
                                >
                                  {copiedCode === invite.code ? (
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                                <span>{invite.scanCount || 0} scans</span>
                                <span>·</span>
                                <span>{invite.registrationCount || 0} regs</span>
                              </div>

                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => toggleStatus(invite.id, invite.status)}
                                  className="text-slate-400 hover:text-slate-600"
                                  title={invite.status === "active" ? "Disable" : "Enable"}
                                >
                                  {invite.status === "active" ? (
                                    <ToggleRight className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <ToggleLeft className="w-5 h-5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => startEditContact(invite)}
                                  className="text-slate-400 hover:text-slate-600"
                                  title="Edit contact"
                                >
                                  <User className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {isEditing && (
                              <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditingContact(null)}>
                                <Card className="w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                                  <h3 className="font-semibold">Edit Contact — {church.name} / {placement.name}</h3>
                                  <div>
                                    <label className="text-sm text-slate-500 mb-1 block">Name</label>
                                    <Input
                                      value={contactForm.name}
                                      onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                                      placeholder="Contact person name"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-500 mb-1 block">Email</label>
                                    <Input
                                      value={contactForm.email}
                                      onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                                      placeholder="contact@email.com"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-500 mb-1 block">Phone</label>
                                    <Input
                                      value={contactForm.phone}
                                      onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                                      placeholder="+1 555-000-0000"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => saveContact(invite.id)}>Save</Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingContact(null)}>Cancel</Button>
                                  </div>
                                </Card>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-slate-400 hover:text-slate-600"
                          onClick={() => applyContactToAll(church.id)}
                          title="Apply first placement's contact to all placements for this church"
                        >
                          Copy contact to all
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
