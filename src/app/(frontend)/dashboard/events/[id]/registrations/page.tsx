"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Search,
  Plus,
  Copy,
  Check,
  QrCode,
  Mail,
  Phone,
  Calendar,
  User,
  Filter,
  Download,
  Send,
  MoreVertical,
  Eye,
  Trash2,
  RefreshCw,
  Link2,
  Share2,
  Users,
  UserCheck,
  UserPlus,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Registration {
  id: string;
  inviteCode: string;
  guest: {
    name: string;
    email: string;
    phone: string;
  } | null;
  status: "invited" | "registered" | "attended" | "baptized";
  invitedBy: {
    name: string;
    church: string;
  };
  registeredAt: string | null;
  attendedAt: string | null;
  baptizedAt: string | null;
}

// Mock data
const eventData = {
  id: "evt-001",
  title: "Spiritual Empowerment Day 1",
  date: "March 15, 2026",
  location: "Los Angeles Convention Center",
  slug: "spiritual-empowerment-day-1",
};

const mockRegistrations: Registration[] = [
  {
    id: "reg-001",
    inviteCode: "ABC123",
    guest: { name: "John Doe", email: "john.doe@email.com", phone: "+1 555-123-4567" },
    status: "registered",
    invitedBy: { name: "Pastor James", church: "LA Central Church" },
    registeredAt: "2026-03-01T10:30:00",
    attendedAt: null,
    baptizedAt: null,
  },
  {
    id: "reg-002",
    inviteCode: "DEF456",
    guest: { name: "Jane Smith", email: "jane.smith@email.com", phone: "+1 555-987-6543" },
    status: "attended",
    invitedBy: { name: "Brother Mike", church: "SF Bay Church" },
    registeredAt: "2026-03-02T14:15:00",
    attendedAt: "2026-03-15T09:05:00",
    baptizedAt: null,
  },
  {
    id: "reg-003",
    inviteCode: "GHI789",
    guest: { name: "Robert Johnson", email: "robert.j@email.com", phone: "+1 555-456-7890" },
    status: "baptized",
    invitedBy: { name: "Sister Mary", church: "SD South Church" },
    registeredAt: "2026-03-03T09:00:00",
    attendedAt: "2026-03-15T08:45:00",
    baptizedAt: "2026-03-15T11:30:00",
  },
  {
    id: "reg-004",
    inviteCode: "JKL012",
    guest: null,
    status: "invited",
    invitedBy: { name: "Pastor James", church: "LA Central Church" },
    registeredAt: null,
    attendedAt: null,
    baptizedAt: null,
  },
  {
    id: "reg-005",
    inviteCode: "MNO345",
    guest: null,
    status: "invited",
    invitedBy: { name: "Brother David", church: "Sacramento Church" },
    registeredAt: null,
    attendedAt: null,
    baptizedAt: null,
  },
];

export default function RegistrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<string[]>([]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://pmcc4thwatch.us";

  const filteredRegistrations = mockRegistrations.filter(reg => {
    const matchesSearch =
      reg.inviteCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.guest?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (reg.guest?.email.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      reg.invitedBy.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || reg.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockRegistrations.length,
    invited: mockRegistrations.filter(r => r.status === "invited").length,
    registered: mockRegistrations.filter(r => r.status === "registered").length,
    attended: mockRegistrations.filter(r => r.status === "attended").length,
    baptized: mockRegistrations.filter(r => r.status === "baptized").length,
  };

  const copyToClipboard = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateInviteLinks = (count: number) => {
    // Generate random invite codes
    const codes = Array.from({ length: count }, () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    });

    const links = codes.map(code => `${baseUrl}/register/${eventData.slug}?code=${code}`);
    setGeneratedLinks(links);
    setShowGenerateModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "invited":
        return "bg-slate-100 text-slate-600";
      case "registered":
        return "bg-blue-100 text-blue-700";
      case "attended":
        return "bg-green-100 text-green-700";
      case "baptized":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-600";
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
                <h1 className="text-xl font-bold">Registrations</h1>
                <p className="text-sm text-muted-foreground">{eventData.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href={`/admin/events/${eventData.id}/check-in`}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Check-in Mode
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Links
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => generateInviteLinks(1)}>
                    Generate 1 Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generateInviteLinks(5)}>
                    Generate 5 Links
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generateInviteLinks(10)}>
                    Generate 10 Links
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generateInviteLinks(25)}>
                    Generate 25 Links
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.invited}</p>
                <p className="text-sm text-muted-foreground">Invited</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.registered}</p>
                <p className="text-sm text-muted-foreground">Registered</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.attended}</p>
                <p className="text-sm text-muted-foreground">Attended</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.baptized}</p>
                <p className="text-sm text-muted-foreground">Baptized</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, email, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white"
              >
                <option value="all">All Status</option>
                <option value="invited">Invited</option>
                <option value="registered">Registered</option>
                <option value="attended">Attended</option>
                <option value="baptized">Baptized</option>
              </select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </Card>

        {/* Registrations Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Guest</th>
                  <th className="text-left p-4 font-semibold text-sm">Invite Code</th>
                  <th className="text-left p-4 font-semibold text-sm">Invited By</th>
                  <th className="text-left p-4 font-semibold text-sm">Status</th>
                  <th className="text-left p-4 font-semibold text-sm">Registered</th>
                  <th className="text-right p-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      {reg.guest ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{reg.guest.name}</p>
                            <p className="text-sm text-muted-foreground">{reg.guest.email}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-muted-foreground italic">Pending registration</p>
                            <p className="text-sm text-muted-foreground">Link not yet used</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">
                          {reg.inviteCode}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(
                            `${baseUrl}/register/${eventData.slug}?code=${reg.inviteCode}`,
                            reg.inviteCode
                          )}
                        >
                          {copiedCode === reg.inviteCode ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">{reg.invitedBy.name}</p>
                        <p className="text-sm text-muted-foreground">{reg.invitedBy.church}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(reg.status)}>
                        {reg.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {reg.registeredAt ? (
                        <span className="text-sm">
                          {new Date(reg.registeredAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyToClipboard(
                            `${baseUrl}/register/${eventData.slug}?code=${reg.inviteCode}`,
                            reg.inviteCode
                          )}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <QrCode className="w-4 h-4 mr-2" />
                            View QR Code
                          </DropdownMenuItem>
                          {reg.guest && (
                            <>
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Reminder
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRegistrations.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No registrations found</h3>
              <p className="text-muted-foreground mb-4">
                Generate invite links to start collecting registrations
              </p>
              <Button onClick={() => generateInviteLinks(5)}>
                <Plus className="w-4 h-4 mr-2" />
                Generate Links
              </Button>
            </div>
          )}
        </Card>
      </main>

      {/* Generate Links Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Generated Invite Links</h2>
                  <p className="text-sm text-muted-foreground">
                    Share these links with potential guests
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowGenerateModal(false)}>
                  <span className="sr-only">Close</span>
                  ×
                </Button>
              </div>

              <div className="space-y-3 mb-6">
                {generatedLinks.map((link, index) => {
                  const code = link.split("code=")[1];
                  return (
                    <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <code className="flex-1 text-sm truncate">{link}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => copyToClipboard(link, code)}
                      >
                        {copiedCode === code ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const allLinks = generatedLinks.join("\n");
                    navigator.clipboard.writeText(allLinks);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Links
                </Button>
                <Button className="flex-1" onClick={() => setShowGenerateModal(false)}>
                  Done
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
