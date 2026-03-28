"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Copy,
  RefreshCw,
  Check,
  Loader2,
  Search,
  Church,
  Download,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChurch, setSelectedChurch] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateInvites = async (churchId?: string) => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/events/${resolvedParams.eventId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regenerate: false,
          churchId: churchId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchData();
        alert(data.message);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to generate invites");
      }
    } catch (error) {
      console.error("Failed to generate invites:", error);
      alert("Failed to generate invites");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyInviteLink = (invite: EventInvite) => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/event-invite/${invite.inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedCode(invite.id);
    setTimeout(() => setCopiedCode(null), 2000);
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
        <Button
          onClick={() => handleGenerateInvites()}
          disabled={generating}
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Generate All Invites
        </Button>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="by-church" className="mt-6">
            <div className="space-y-6">
              {Object.entries(groupedInvites).map(([churchName, churchInvites]) => (
                <Card key={churchName} className="bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Church className="w-5 h-5 text-slate-500" />
                      <h3 className="font-semibold">{churchName}</h3>
                      <Badge variant="secondary">{churchInvites.length} members</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const church = churches.find((c) => c.name === churchName);
                        if (church) {
                          handleGenerateInvites(church.id);
                        }
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {churchInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between bg-white p-3 rounded-lg"
                      >
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
                        </div>
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
