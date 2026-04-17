"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Copy,
  Check,
  Loader2,
  Search,
  Church,
  Download,
  ArrowLeft,
  QrCode,
  Archive,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QRCode from "qrcode";
import JSZip from "jszip";

interface Event {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  location: string;
}

interface EventInvite {
  id: string;
  inviteCode: string;
  invitedBy?: string;
  memberName: string;
  memberPhone?: string;
  memberEmail?: string;
  church?: {
    id: string;
    name: string;
  };
  registrationCount: number;
  status: string;
}

interface Church {
  id: string;
  name: string;
}

export default function EventInvitesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const resolvedParams = use(params);
  const [invites, setInvites] = useState<EventInvite[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChurch, setSelectedChurch] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [expandedInviteId, setExpandedInviteId] = useState<string | null>(null);
  const [expandedQrDataUrl, setExpandedQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");
  const [generating, setGenerating] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get event details
      const eventRes = await fetch(
        `/payload-api/managed-events/${resolvedParams.eventId}`
      );
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData);
      }

      // Get invites
      const invitesRes = await fetch(
        `/api/events/${resolvedParams.eventId}/invites`
      );
      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvites(invitesData.invites || []);
      }

      // Get churches for filter
      const churchesRes = await fetch("/payload-api/churches?limit=999");
      if (churchesRes.ok) {
        const churchesData = await churchesRes.json();
        setChurches(churchesData.docs || []);
      }

      // Get current user role (for gating QR features)
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUserRole(meData.user?.role || null);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateInvites = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/events/${resolvedParams.eventId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (result.created > 0) await fetchData();
      alert(result.created > 0
        ? `Generated ${result.created} new invite${result.created > 1 ? "s" : ""}`
        : "All members already have invites");
    } catch (err) {
      console.error("Failed to generate invites:", err);
    } finally {
      setGenerating(false);
    }
  };

  const migrateCodes = async () => {
    if (!confirm("Convert all existing UUID invite codes to short 8-char codes? This cannot be undone.")) return;
    setMigrating(true);
    try {
      const res = await fetch("/api/admin/migrate-invite-codes", { method: "POST" });
      const result = await res.json();
      await fetchData();
      alert(result.message || `Migrated ${result.migrated} codes`);
    } catch (err) {
      console.error("Migration failed:", err);
      alert("Migration failed — check console");
    } finally {
      setMigrating(false);
    }
  };

  const handleCopyInviteLink = (invite: EventInvite) => {
    const baseUrl = window.location.origin;
    const inviteLink = event?.slug
      ? `${baseUrl}/register/${event.slug}?invite=${invite.inviteCode}`
      : `${baseUrl}/register?invite=${invite.inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedCode(invite.id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isAdmin = currentUserRole === "superAdmin" || currentUserRole === "eventAdmin";
  const isSuperAdmin = currentUserRole === "superAdmin";

  const buildInviteLink = (invite: EventInvite) => {
    const baseUrl = window.location.origin;
    return event?.slug
      ? `${baseUrl}/register/${event.slug}?invite=${invite.inviteCode}`
      : `${baseUrl}/register?invite=${invite.inviteCode}`;
  };

  const toggleQr = async (invite: EventInvite) => {
    if (expandedInviteId === invite.id) {
      setExpandedInviteId(null);
      setExpandedQrDataUrl(null);
      return;
    }
    setExpandedInviteId(invite.id);
    setQrLoading(true);
    setExpandedQrDataUrl(null);
    try {
      const link = buildInviteLink(invite);
      const dataUrl = await QRCode.toDataURL(link, { type: "image/png", width: 256, margin: 2 });
      setExpandedQrDataUrl(dataUrl);
    } catch (err) {
      console.error("QR generation failed:", err);
    } finally {
      setQrLoading(false);
    }
  };

  const downloadAllQrZip = async () => {
    setDownloadingAll(true);
    setDownloadProgress("Preparing...");
    try {
      const zip = new JSZip();
      let generated = 0;
      const total = invites.length;
      for (const invite of invites) {
        const link = buildInviteLink(invite);
        const safeName = (invite.memberName || "unknown").replace(/[^a-zA-Z0-9]/g, "-");
        try {
          const dataUrl = await QRCode.toDataURL(link, { type: "image/png", width: 512, margin: 2 });
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          zip.file(`qr-${safeName}.png`, blob);
        } catch (err) {
          console.error(`Skipping QR for ${invite.memberName}:`, err);
        }
        generated++;
        setDownloadProgress(`Generating QR ${generated}/${total}...`);
        if (generated % 10 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      setDownloadProgress("Compressing ZIP...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      const safeEvent = (event?.title || "event").replace(/[^a-zA-Z0-9]/g, "-");
      link.download = `${safeEvent}-invite-qr-codes.zip`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 5000);
      setDownloadProgress("");
    } catch (err) {
      console.error("Failed to generate ZIP:", err);
      setDownloadProgress("Failed — see console");
    } finally {
      setDownloadingAll(false);
    }
  };

  const filteredInvites = invites.filter((invite) => {
    const matchesSearch =
      invite.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invite.memberPhone?.includes(searchTerm) ||
      invite.memberEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChurch =
      !selectedChurch || invite.church?.id === selectedChurch;
    return matchesSearch && matchesChurch;
  });

  const groupedInvites = filteredInvites.reduce((acc, invite) => {
    const churchName = invite.church?.name || "Unassigned";
    if (!acc[churchName]) {
      acc[churchName] = [];
    }
    acc[churchName].push(invite);
    return acc;
  }, {} as Record<string, EventInvite[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Event Invites</h1>
            <p className="text-slate-500">{event?.title || "Loading..."}</p>
          </div>
        </div>
        {isAdmin && invites.length > 0 && (
          <Button size="sm" variant="outline" onClick={downloadAllQrZip} disabled={downloadingAll}>
            {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Archive className="w-4 h-4 mr-1" />}
            {downloadingAll ? (downloadProgress || "Generating...") : "Download All QR (ZIP)"}
          </Button>
        )}
        {isAdmin && (
          <Button size="sm" onClick={generateInvites} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Users className="w-4 h-4 mr-1" />}
            {generating ? "Generating..." : "Generate Invites"}
          </Button>
        )}
        {isSuperAdmin && (
          <Button size="sm" variant="outline" onClick={migrateCodes} disabled={migrating}>
            {migrating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            {migrating ? "Migrating..." : "Migrate UUID → Short Codes"}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{invites.length}</p>
              <p className="text-xs text-slate-500">Total Invites</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {invites.reduce((sum, i) => sum + (i.registrationCount || 0), 0)}
              </p>
              <p className="text-xs text-slate-500">Registrations</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Church className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.keys(groupedInvites).length}
              </p>
              <p className="text-xs text-slate-500">Churches</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Download className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {invites.filter(i => (i.registrationCount || 0) > 0).length}
              </p>
              <p className="text-xs text-slate-500">Active Inviters</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-white p-6">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="by-church">By Church</TabsTrigger>
          </TabsList>

          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedChurch}
              onChange={(e) => setSelectedChurch(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All Churches</option>
              {churches.map((church) => (
                <option key={church.id} value={church.id}>
                  {church.name}
                </option>
              ))}
            </select>
          </div>

          <TabsContent value="list" className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Member</th>
                    <th className="text-left py-3 px-4">Church</th>
                    <th className="text-center py-3 px-4">Registrations</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvites.map((invite) => (
                    <>
                      <tr key={invite.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{invite.memberName}</p>
                            <p className="text-sm text-slate-500">
                              {invite.memberPhone || invite.memberEmail || "No contact"}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {invite.church?.name || "Unassigned"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="secondary">{invite.registrationCount}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyInviteLink(invite)}
                              title="Copy Invite Link"
                            >
                              {copiedCode === invite.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleQr(invite)}
                                title="Show QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isAdmin && expandedInviteId === invite.id && (
                        <tr key={`${invite.id}-qr`} className="border-b bg-slate-50">
                          <td colSpan={4} className="py-4 px-4">
                            <div className="flex flex-col items-center gap-3">
                              <p className="text-xs text-slate-500 break-all">{buildInviteLink(invite)}</p>
                              {qrLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                              ) : expandedQrDataUrl ? (
                                <img src={expandedQrDataUrl} alt={`QR for ${invite.memberName}`} className="w-48 h-48" />
                              ) : null}
                              {expandedQrDataUrl && (
                                <Button variant="outline" size="sm" onClick={() => {
                                  const a = document.createElement("a");
                                  const safeName = (invite.memberName || "invite").replace(/[^a-zA-Z0-9]/g, "-");
                                  a.download = `qr-${safeName}.png`;
                                  a.href = expandedQrDataUrl;
                                  document.body.appendChild(a);
                                  a.click();
                                  setTimeout(() => document.body.removeChild(a), 1000);
                                }}>
                                  <Download className="w-4 h-4 mr-1" /> Download QR
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="by-church" className="mt-6">
            <div className="space-y-6">
              {Object.entries(groupedInvites).map(([churchName, churchInvites]) => (
                <Card key={churchName} className="bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Church className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold">{churchName}</h3>
                    <Badge variant="secondary">{churchInvites.length} members</Badge>
                  </div>
                  <div className="space-y-2">
                    {churchInvites.map((invite) => (
                      <div key={invite.id} className="bg-white rounded-lg">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex-1">
                            <p className="font-medium">{invite.memberName}</p>
                            <p className="text-sm text-slate-500">
                              {invite.memberPhone || invite.memberEmail || "No contact"}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="secondary">{invite.registrationCount}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyInviteLink(invite)}
                            >
                              {copiedCode === invite.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleQr(invite)}
                                title="Show QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {isAdmin && expandedInviteId === invite.id && (
                          <div className="flex flex-col items-center gap-3 py-4 border-t">
                            <p className="text-xs text-slate-500 break-all px-4">{buildInviteLink(invite)}</p>
                            {qrLoading ? (
                              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                            ) : expandedQrDataUrl ? (
                              <img src={expandedQrDataUrl} alt={`QR for ${invite.memberName}`} className="w-48 h-48" />
                            ) : null}
                            {expandedQrDataUrl && (
                              <Button variant="outline" size="sm" onClick={() => {
                                const a = document.createElement("a");
                                const safeName = (invite.memberName || "invite").replace(/[^a-zA-Z0-9]/g, "-");
                                a.download = `qr-${safeName}.png`;
                                a.href = expandedQrDataUrl;
                                document.body.appendChild(a);
                                a.click();
                                setTimeout(() => document.body.removeChild(a), 1000);
                              }}>
                                <Download className="w-4 h-4 mr-1" /> Download QR
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <Card className="bg-blue-50 border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          How to use invite links
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Click "Copy" on any member's invite link</li>
          <li>Share the link with the member (via email, SMS, etc.)</li>
          <li>Members can share their unique link with guests</li>
          <li>Guests register through the member's personalized link</li>
          <li>Track which member invited which guest</li>
        </ol>
      </Card>
    </div>
  );
}
