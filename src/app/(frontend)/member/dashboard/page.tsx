"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Copy,
  Check,
  Share2,
  Calendar,
  Users,
  QrCode,
  ExternalLink,
  ChevronRight,
  Loader2,
  LogOut,
  Settings,
  Sparkles,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MemberData {
  id: string;
  name: string;
  email: string;
  phone: string;
  inviteCode: string;
  church: string | null;
  role: string;
}

interface Stats {
  totalInvites: number;
  registered: number;
  attended: number;
  baptized: number;
}

export default function MemberDashboard() {
  const router = useRouter();
  const [member, setMember] = useState<MemberData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          // Not authenticated, redirect to login
          router.push("/member/login");
          return;
        }

        const data = await response.json();
        setMember(data.user);
        setStats(data.stats);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        router.push("/member/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const inviteLink = member
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${member.inviteCode}`
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (!member) return;

    const shareData = {
      title: "You're Invited to PMCC 4th Watch",
      text: `${member.name} has invited you to join us at our upcoming events!`,
      url: inviteLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/member/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center bg-primary/10">
                <span className="text-primary font-serif font-bold text-sm">P</span>
              </div>
              <div>
                <span className="text-primary font-serif text-lg font-semibold">PMCC</span>
                <span className="text-muted-foreground text-xs block tracking-[0.2em] uppercase">
                  Member Portal
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 mr-4 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                {member.name}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">
              Welcome, {member.name}!
            </h1>
            <p className="text-muted-foreground">
              {member.church || "PMCC 4th Watch Member"} • {member.role}
            </p>
          </div>

          {/* Invite Link Card */}
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Your Personal Invite Link</h2>
                <p className="text-white/70 text-sm">
                  Share this link with guests to invite them to our events
                </p>
              </div>
              <QrCode className="w-10 h-10 text-white/50" />
            </div>

            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <code className="text-white text-sm break-all">{inviteLink}</code>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                className="flex-1 bg-white text-primary hover:bg-white/90"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                className="flex-1 bg-white/20 text-white hover:bg-white/30 border-0"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                variant="secondary"
                className="flex-1 bg-white/20 text-white hover:bg-white/30 border-0"
                asChild
              >
                <Link href={`/invite/${member.inviteCode}`} target="_blank">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </Link>
              </Button>
            </div>
          </Card>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalInvites}</p>
                    <p className="text-muted-foreground text-xs">Invited</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.registered}</p>
                    <p className="text-muted-foreground text-xs">Registered</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-purple-100 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.attended}</p>
                    <p className="text-muted-foreground text-xs">Attended</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.baptized}</p>
                    <p className="text-muted-foreground text-xs">Baptized</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Quick Links */}
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 hover:border-primary/50 transition-colors">
              <Link href="/" className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Visit Website</h3>
                  <p className="text-sm text-muted-foreground">pmcc4thwatch.us</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </Card>
            <Card className="p-4 hover:border-primary/50 transition-colors">
              <Link href="/events" className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Upcoming Events</h3>
                  <p className="text-sm text-muted-foreground">View all events</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </Card>
          </div>

          {/* Admin Link (if admin role) */}
          {["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary", "eventAdmin"].includes(member.role) && (
            <div className="mt-8 pt-8 border-t">
              <Card className="p-4 bg-primary/5 border-primary/20">
                <Link href="/admin" className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-primary">Admin Dashboard</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage events, registrations, check-in, and more
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary" />
                </Link>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
