"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatEventDate, formatEventTime } from "@/lib/event-date";
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  Download,
  Share2,
  Home,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TicketData {
  registration: {
    id: string;
    code: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    status: string;
    sourceType?: string;
    registeredAt: string;
    attendedAt: string | null;
    baptizedAt: string | null;
  };
  event: {
    id: string;
    title: string;
    startDate: string;
    location: string;
    hasBaptism: boolean;
  };
  invitedBy: {
    name: string;
    church: string;
    phone?: string;
    email?: string;
  } | null;
}

export default function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(`/api/check-in?code=${resolvedParams.code}`);
        if (!response.ok) {
          throw new Error("Ticket not found");
        }
        const data = await response.json();
        setTicketData(data);
      } catch (err) {
        setError("Could not find your ticket. Please check the URL.");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [resolvedParams.code]);

  const qrCodeUrl = ticketData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticketData.registration.code)}`
    : "";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "registered":
        return <Badge className="bg-blue-500">Registered</Badge>;
      case "attended":
        return <Badge className="bg-green-500">Attended</Badge>;
      case "baptized":
        return <Badge className="bg-purple-500">Baptized</Badge>;
      default:
        return <Badge className="bg-slate-500">{status}</Badge>;
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `ticket-${ticketData?.registration.code}.png`;
    link.click();
  };

  const handleShare = async () => {
    if (!ticketData) return;
    const shareData = {
      title: `Ticket for ${ticketData.event.title}`,
      text: `My registration code: ${ticketData.registration.code}`,
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-white mb-2">Ticket Not Found</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <header className="bg-[#0a0f1a] border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-secondary flex items-center justify-center bg-secondary/10">
              <span className="text-secondary font-serif font-bold text-sm">P</span>
            </div>
            <div>
              <span className="text-white font-serif text-lg font-semibold">PMCC</span>
              <span className="text-white/50 text-xs block tracking-[0.2em] uppercase">4th Watch</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Status Banner */}
        {ticketData.registration.status === "attended" && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-green-400 font-semibold">You've checked in!</p>
              <p className="text-green-400/70 text-sm">
                Checked in on {formatEventDate(ticketData.registration.attendedAt ?? "")} at {formatEventTime(ticketData.registration.attendedAt ?? "")}
              </p>
            </div>
          </div>
        )}

        {ticketData.registration.status === "baptized" && (
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-purple-400 font-semibold">Congratulations on your baptism!</p>
              <p className="text-purple-400/70 text-sm">
                Baptized on {formatEventDate(ticketData.registration.baptizedAt ?? "")}
              </p>
            </div>
          </div>
        )}

        {/* Ticket Card */}
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          {/* Event Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-center">
            <p className="text-primary-foreground/70 text-sm uppercase tracking-wider mb-2">Event Ticket</p>
            <h1 className="text-2xl font-serif font-bold text-white mb-2">
              {ticketData.event.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatEventDate(ticketData.event.startDate)}
              </span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-8 text-center border-b border-white/10">
            <div className="bg-white rounded-xl p-6 inline-block mb-4">
              <img
                src={qrCodeUrl}
                alt="Your QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-white font-mono text-2xl font-bold tracking-wider">
              {ticketData.registration.code}
            </p>
            <p className="text-white/50 text-sm mt-2">
              Present this QR code at the event check-in
            </p>
          </div>

          {/* Guest Info */}
          <div className="p-6 border-b border-white/10">
            <h2 className="text-white/50 text-xs uppercase tracking-wider mb-4">Registered Guest</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white">
                <User className="w-5 h-5 text-white/50" />
                <span className="font-medium">{ticketData.registration.guestName}</span>
                {getStatusBadge(ticketData.registration.status)}
              </div>
              {ticketData.registration.guestEmail && (
                <div className="flex items-center gap-3 text-white/70">
                  <Mail className="w-5 h-5 text-white/50" />
                  <span>{ticketData.registration.guestEmail}</span>
                </div>
              )}
              {ticketData.registration.guestPhone && (
                <div className="flex items-center gap-3 text-white/70">
                  <Phone className="w-5 h-5 text-white/50" />
                  <span>{ticketData.registration.guestPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6 border-b border-white/10">
            <h2 className="text-white/50 text-xs uppercase tracking-wider mb-4">Event Details</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-white/70">
                <Calendar className="w-5 h-5 text-white/50 mt-0.5" />
                <div>
                  <p className="text-white">{formatEventDate(ticketData.event.startDate)}</p>
                  <p>{formatEventTime(ticketData.event.startDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-white/70">
                <MapPin className="w-5 h-5 text-white/50 mt-0.5" />
                <p>{ticketData.event.location}</p>
              </div>
            </div>
          </div>

          {/* Invited By / Contact */}
          {ticketData.registration.sourceType !== "platform" && ticketData.invitedBy && (
            <div className="p-6 border-b border-white/10 bg-secondary/5">
              <h2 className="text-white/50 text-xs uppercase tracking-wider mb-4">For any questions, please contact</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-white font-medium">{ticketData.invitedBy.name}</p>
                  {ticketData.invitedBy.church && (
                    <p className="text-white/60 text-sm">{ticketData.invitedBy.church}</p>
                  )}
                  {ticketData.invitedBy.phone && (
                    <a href={`tel:${ticketData.invitedBy.phone}`} className="text-secondary text-sm flex items-center gap-1 mt-1 hover:underline">
                      <Phone className="w-4 h-4" />
                      {ticketData.invitedBy.phone}
                    </a>
                  )}
                  {ticketData.invitedBy.email && (
                    <a href={`mailto:${ticketData.invitedBy.email}`} className="text-secondary text-sm flex items-center gap-1 hover:underline">
                      <Mail className="w-4 h-4" />
                      {ticketData.invitedBy.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={handleDownloadQR}
              >
                <Download className="w-4 h-4 mr-2" />
                Save QR Code
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Ticket
              </Button>
            </div>
            <div className="mt-3">
              <Button
                variant="outline"
                className="w-full bg-secondary/10 border-secondary/30 text-secondary hover:bg-secondary/20"
                onClick={() => window.open(`/api/ticket/${ticketData?.registration.code}/pdf`, '_blank')}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Ticket
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-white/40 text-sm mt-8">
          Registered on {formatEventDate(ticketData.registration.registeredAt)}
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-white/30 text-sm text-center">
            © {new Date().getFullYear()} Pentecostal Missionary Church of Christ (4th Watch)
          </p>
        </div>
      </footer>
    </div>
  );
}
