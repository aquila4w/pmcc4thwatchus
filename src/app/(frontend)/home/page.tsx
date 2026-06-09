"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  CheckCircle,
  Sparkles,
  Share2,
  Gift,
  Heart,
  Loader2,
  Church,
  MapPin,
  User,
  QrCode,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  church?: string;
  inviteCode?: string;
}

interface InviteData {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string;
  eventLocation: string;
  inviteCode: string;
  registrationCount: number;
}

interface StatsData {
  totalInvites: number;
  registered: number;
  attended: number;
  baptized: number;
}

export default function MemberHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [invites, setInvites] = useState<InviteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showUserQR, setShowUserQR] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setStats(data.stats || { totalInvites: 0, registered: 0, attended: 0, baptized: 0 });
          setInvites(data.eventInvites || []);
        } else {
          router.push("/member/login");
        }
      } catch {
        router.push("/member/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const copyInviteLink = (inviteCode: string) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/i/${inviteCode}`);
    setCopiedCode(inviteCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadQR = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  // Universal user QR — encodes the user's invite code for identification across events
  const userQRUrl = user?.inviteCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`PMCC4W-${user.inviteCode}`)}`
    : "";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f6f3] dark:bg-[#0a0f1a]">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#f8f6f3] dark:bg-[#0a0f1a]">
      <Header />

      {/* Welcome Banner */}
      <section className="relative bg-gradient-to-r from-primary via-primary/90 to-secondary/80 pt-8 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Welcome, {user.name}! 🙏
                </h1>
                {user.church && (
                  <p className="text-white/80 flex items-center gap-1 mt-1">
                    <Church className="w-4 h-4" />
                    {user.church}
                  </p>
                )}
              </div>
            </div>
            <p className="text-white/70 text-lg">
              Share the love of Christ — invite someone to our next event!
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-8 relative z-10 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* My ID Card — Universal QR */}
          {user.inviteCode && (
            <Card className="bg-white dark:bg-slate-900/50 overflow-hidden">
              <div className="p-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    My ID Card
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Show this QR at any event for identification & attendance
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={showUserQR ? "secondary" : "outline"}
                  onClick={() => setShowUserQR(!showUserQR)}
                >
                  {showUserQR ? "Hide" : "Show"} QR
                </Button>
              </div>
              {showUserQR && (
                <div className="border-t px-5 py-6 flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <img
                      src={userQRUrl}
                      alt="My ID QR Code"
                      width={200}
                      height={200}
                      className="mx-auto"
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{user.name}</p>
                    <p className="text-sm text-slate-500">ID: {user.inviteCode}</p>
                    {user.church && (
                      <p className="text-sm text-slate-500">{user.church}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => downloadQR(userQRUrl, `my-id-${user.inviteCode}.png`)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* My Stats */}
          {stats && stats.totalInvites > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-white dark:bg-slate-900/50 p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                  <Share2 className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{stats.totalInvites}</p>
                <p className="text-xs text-slate-500">Invites Sent</p>
              </Card>
              <Card className="bg-white dark:bg-slate-900/50 p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{stats.registered}</p>
                <p className="text-xs text-slate-500">Registered</p>
              </Card>
              <Card className="bg-white dark:bg-slate-900/50 p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{stats.attended}</p>
                <p className="text-xs text-slate-500">Attended</p>
              </Card>
              <Card className="bg-white dark:bg-slate-900/50 p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-bold">{stats.baptized}</p>
                <p className="text-xs text-slate-500">Baptized</p>
              </Card>
            </div>
          )}

          {/* My Active Invites / Events */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                My Active Invites
              </h2>
              {invites.length > 0 && (
                <Badge variant="secondary">{invites.length} active</Badge>
              )}
            </div>

            {invites.length > 0 ? (
              <div className="space-y-4">
                {invites.map((invite) => {
                  const inviteLink = `${window.location.origin}/i/${invite.inviteCode}`;
                  const inviteQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inviteLink)}`;
                  return (
                    <Card key={invite.eventId} className="bg-white dark:bg-slate-900/50 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-5">
                        <div className="flex gap-4">
                          {/* QR Code */}
                          <div className="flex-shrink-0">
                            <div className="bg-white p-2 rounded-lg border">
                              <img
                                src={inviteQRUrl}
                                alt={`QR for ${invite.eventTitle}`}
                                width={100}
                                height={100}
                              />
                            </div>
                          </div>
                          {/* Event Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-semibold text-lg leading-tight flex-1">{invite.eventTitle}</h3>
                              <Badge variant="outline" className="ml-2 flex-shrink-0">
                                {invite.registrationCount} registered
                              </Badge>
                            </div>
                            <div className="space-y-0.5 text-sm text-slate-500 mb-3">
                              <p className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDate(invite.eventDate)}
                              </p>
                              {invite.eventLocation && (
                                <p className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {invite.eventLocation}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" className="flex-1 sm:flex-none" asChild>
                                <Link href={`/i/${invite.inviteCode}`}>
                                  <Share2 className="w-4 h-4 mr-1" />
                                  Open
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyInviteLink(invite.inviteCode)}
                              >
                                {copiedCode === invite.inviteCode ? (
                                  <><Check className="w-4 h-4 mr-1" />Copied</>
                                ) : (
                                  <><Copy className="w-4 h-4 mr-1" />Copy Link</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadQR(inviteQRUrl, `invite-${invite.inviteCode}.png`)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                QR
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-white dark:bg-slate-900/50 p-8 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  No active event invites
                </h3>
                <p className="text-sm text-slate-500">
                  When events open for registration, your invite links will appear here.
                </p>
              </Card>
            )}
          </section>

          {/* Quick Links */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-secondary" />
              Quick Links
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/give" className="group">
                <Card className="bg-white dark:bg-slate-900/50 p-4 text-center hover:shadow-md transition-all group-hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Gift className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-medium text-sm">Give</p>
                </Card>
              </Link>
              <Link href="/prayer-request" className="group">
                <Card className="bg-white dark:bg-slate-900/50 p-4 text-center hover:shadow-md transition-all group-hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="font-medium text-sm">Prayer Request</p>
                </Card>
              </Link>
              <Link href="/news-events" className="group">
                <Card className="bg-white dark:bg-slate-900/50 p-4 text-center hover:shadow-md transition-all group-hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="font-medium text-sm">News & Events</p>
                </Card>
              </Link>
              <Link href="/contact" className="group">
                <Card className="bg-white dark:bg-slate-900/50 p-4 text-center hover:shadow-md transition-all group-hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Church className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="font-medium text-sm">Contact Us</p>
                </Card>
              </Link>
            </div>
          </section>

        </div>
      </div>

      <Footer />
    </main>
  );
}
