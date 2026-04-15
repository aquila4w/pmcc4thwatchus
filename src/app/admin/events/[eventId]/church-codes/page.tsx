"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
  RefreshCw,
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
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: "active" | "disabled";
  scanCount: number;
  registrationCount: number;
}

interface Church { id: string; name: string }
interface Placement { id: string; name: string }

export default function ChurchCodesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/church-event-invites?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEventTitle(data.event?.title || "");
        setEventSlug(data.event?.slug || "");
        setChurches(data.churches || []);
        setPlacements(data.placements || []);
        setInvites(data.invites || []);
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

  const getInvite = (churchId: string, placementId: string): ChurchInvite | undefined =>
    invites.find((i) => i.church === churchId && i.adPlacement === placementId);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://pmcc4thwatch.us";

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${baseUrl}/register/${eventSlug}?ad=${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleStatus = async (inviteId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      const res = await fetch("/api/admin/church-event-invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inviteId, status: newStatus }),
      });
      if (res.ok) {
        setInvites((prev) =>
          prev.map((i) => (i.id === inviteId ? { ...i, status: newStatus as "active" | "disabled" } : i))
        );
      }
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
        body: JSON.stringify({ eventId }),
      });
      const result = await res.json();
      if (result.created > 0) await fetchData();
    } catch (err) {
      console.error("Failed to generate codes:", err);
    } finally {
      setGenerating(false);
    }
  };

  const saveContact = async (inviteId: string) => {
    try {
      const res = await fetch("/api/admin/church-event-invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inviteId,
          contactName: contactForm.name || null,
          contactEmail: contactForm.email || null,
          contactPhone: contactForm.phone || null,
        }),
      });
      if (res.ok) {
        setInvites((prev) =>
          prev.map((i) =>
            i.id === inviteId
              ? { ...i, contactName: contactForm.name, contactEmail: contactForm.email, contactPhone: contactForm.phone }
              : i
          )
        );
        setEditingContact(null);
      }
    } catch (err) {
      console.error("Failed to save contact:", err);
    }
  };

  const applyContactToAll = async (churchId: string) => {
    const churchInvites = invites.filter((i) => i.church === churchId);
    const first = churchInvites[0];
    if (!first) return;

    try {
      await Promise.all(
        churchInvites.map((i) =>
          fetch("/api/admin/church-event-invites", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: i.id,
              contactName: first.contactName || null,
              contactEmail: first.contactEmail || null,
              contactPhone: first.contactPhone || null,
            }),
          })
        )
      );
      await fetchData();
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
          <h1 className="text-2xl font-semibold text-slate-900">Church QR Codes</h1>
          <p className="text-sm text-slate-500">{eventTitle}</p>
        </div>
      </div>

      {/* Stats + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="text-sm py-1 px-3">{invites.length} codes</Badge>
        <Badge variant="outline" className="text-sm py-1 px-3">{activeCount} active</Badge>
        <Badge variant="outline" className="text-sm py-1 px-3">{totalScans} scans</Badge>
        <Badge variant="outline" className="text-sm py-1 px-3">{totalRegs} registrations</Badge>
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={generateCodes} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Generate Missing
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/events/${eventId}/analytics`}>
              <ExternalLink className="w-4 h-4 mr-1" /> Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Matrix */}
      {churches.length === 0 || placements.length === 0 ? (
        <Card className="p-12 text-center">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            {placements.length === 0 ? "No Ad Placements Yet" : "No Churches Yet"}
          </h2>
          <p className="text-slate-500 text-sm">
            {placements.length === 0
              ? "Create ad placements first under Admin > Ad Placements."
              : "Churches are managed under Admin > Organization."}
          </p>
        </Card>
      ) : (
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
                          <td key={placement.id} className="px-3 py-3 text-center text-slate-300 text-xs">—</td>
                        );
                      }

                      return (
                        <td key={placement.id} className="px-3 py-2">
                          <div className={`rounded-lg border p-2 text-center space-y-1.5 ${
                            invite.status === "active" ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-60"
                          }`}>
                            <div className="flex items-center justify-center gap-1">
                              <code className="text-xs font-mono font-bold text-slate-700">{invite.code}</code>
                              <button onClick={() => copyLink(invite.code)} className="text-slate-400 hover:text-slate-600" title="Copy invite link">
                                {copiedCode === invite.code ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                              <span>{invite.scanCount || 0} scans</span>
                              <span>·</span>
                              <span>{invite.registrationCount || 0} regs</span>
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => toggleStatus(invite.id, invite.status)} className="text-slate-400 hover:text-slate-600" title={invite.status === "active" ? "Disable" : "Enable"}>
                                {invite.status === "active" ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                              </button>
                              <button onClick={() => startEditContact(invite)} className="text-slate-400 hover:text-slate-600" title="Edit contact">
                                <User className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {editingContact === invite.id && (
                            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditingContact(null)}>
                              <Card className="w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                                <h3 className="font-semibold">Edit Contact — {church.name} / {placement.name}</h3>
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
                      <Button size="sm" variant="ghost" className="text-xs text-slate-400 hover:text-slate-600" onClick={() => applyContactToAll(church.id)} title="Apply first placement's contact to all">
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
  );
}
