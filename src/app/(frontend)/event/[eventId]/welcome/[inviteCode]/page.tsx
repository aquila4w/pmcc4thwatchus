"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
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
  Church,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WelcomeData {
  invite: {
    id: string;
    inviteCode: string;
  };
  event: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    startDate: string;
    location: string;
    address?: string;
    eventType?: string;
    landingPage: {
      heroImageUrl?: string;
      title: string;
      content?: string; // Rich text content
      showQR: boolean;
      showInviter: boolean;
      cta?: string;
      ctaLink?: string;
    };
  };
  invitedBy: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    church?: string;
  };
  registrationCount: number;
}

export default function WelcomePage({
  params,
}: {
  params: Promise<{ eventId: string; inviteCode: string }>;
}) {
  const resolvedParams = use(params);
  const [data, setData] = useState<WelcomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First validate the invite code and get event details
        const inviteResponse = await fetch(`/api/event-invite/${resolvedParams.inviteCode}`);

        if (!inviteResponse.ok) {
          throw new Error("Invalid invite link");
        }

        const inviteData = await inviteResponse.json();

        // Then get the registration details
        const registrationResponse = await fetch(
          `/api/check-in?code=${resolvedParams.inviteCode}`
        );

        if (registrationResponse.ok) {
          const registrationData = await registrationResponse.json();
          setData({
            ...inviteData,
            registration: registrationData.registration,
          });
        } else {
          setData(inviteData);
        }
      } catch (err) {
        setError("This invite link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.inviteCode]);

  const qrCodeUrl = data
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(resolvedParams.inviteCode)}`
    : "";

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `registration-${resolvedParams.inviteCode}.png`;
    link.click();
  };

  const handleShare = async () => {
    const shareData = {
      title: `Registration for ${data?.event.title}`,
      text: `I've registered for ${data?.event.title}!`,
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
          <p className="text-white/60">Loading your registration...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-white mb-2">
            Invalid Invite Link
          </h1>
          <p className="text-white/60 mb-6">{error}</p>
          <Button
            asChild
            className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

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
              <span className="text-white font-serif text-lg font-semibold">
                PMCC
              </span>
              <span className="text-white/50 text-xs block tracking-[0.2em] uppercase">
                4th Watch
              </span>
            </div>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Image */}
        {data.event.landingPage.heroImageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            <img
              src={data.event.landingPage.heroImageUrl}
              alt={data.event.title}
              className="w-full h-48 md:h-64 object-cover"
            />
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-secondary mb-4">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider font-semibold">
              You're Registered!
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
            {data.event.landingPage.title}
          </h1>
          {data.event.description && (
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              {data.event.description}
            </p>
          )}
        </div>

        {/* Event Details Card */}
        <Card className="bg-white/5 border-white/10 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-center">
            <p className="text-primary-foreground/70 text-sm uppercase tracking-wider mb-2">
              Event Details
            </p>
            <h2 className="text-2xl font-serif font-bold text-white">
              {data.event.title}
            </h2>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-start gap-3 text-white/70">
                <Calendar className="w-5 h-5 text-white/50 mt-0.5" />
                <div>
                  <p className="text-white font-medium">{formatDate(data.event.startDate)}</p>
                  <p>{formatTime(data.event.startDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-white/70">
                <MapPin className="w-5 h-5 text-white/50 mt-0.5" />
                <p>{data.event.location}</p>
              </div>
            </div>

            {/* QR Code Section */}
            {data.event.landingPage.showQR && (
              <div className="text-center p-6 bg-white/5 rounded-xl mb-6">
                <p className="text-white font-semibold mb-4">Your Registration QR Code</p>
                <div className="bg-white rounded-xl p-4 inline-block mb-4">
                  <img
                    src={qrCodeUrl}
                    alt="Your QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-white/50 text-sm mt-4">
                  Present this QR code at the event check-in
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Button
                    variant="outline"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    onClick={handleDownloadQR}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save QR Code
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            )}

            {/* Inviter Section */}
            {data.event.landingPage.showInviter && data.invitedBy && (
              <div className="p-6 bg-secondary/5 rounded-xl">
                <p className="text-white/50 text-sm uppercase tracking-wider mb-4">
                  Invited By
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{data.invitedBy.name}</p>
                    {data.invitedBy.church && (
                      <p className="text-white/60 text-sm flex items-center gap-1">
                        <Church className="w-4 h-4" />
                        {data.invitedBy.church}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {data.invitedBy.phone && (
                      <a
                        href={`tel:${data.invitedBy.phone}`}
                        className="text-white/60 text-sm flex items-center gap-1 hover:text-secondary"
                      >
                        <Phone className="w-4 h-4" />
                        {data.invitedBy.phone}
                      </a>
                    )}
                    {data.invitedBy.email && (
                      <a
                        href={`mailto:${data.invitedBy.email}`}
                        className="text-white/60 text-sm flex items-center gap-1 hover:text-secondary"
                      >
                        <Mail className="w-4 h-4" />
                        Contact
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Custom Content */}
        {data.event.landingPage.content && (
          <Card className="bg-white/5 border-white/10 p-8 mb-8">
            <div
              className="prose prose-invert prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: data.event.landingPage.content,
              }}
            />
          </Card>
        )}

        {/* CTA Button */}
        {data.event.landingPage.cta && (
          <div className="text-center">
            {data.event.landingPage.ctaLink ? (
              <Button
                asChild
                className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a] text-lg px-8 py-6"
              >
                <Link href={data.event.landingPage.ctaLink}>
                  {data.event.landingPage.cta}
                </Link>
              </Button>
            ) : (
              <Button className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a] text-lg px-8 py-6">
                {data.event.landingPage.cta}
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-white/30 text-sm text-center">
            © {new Date().getFullYear()} Pentecostal Missionary Church of Christ (4th
            Watch)
          </p>
        </div>
      </footer>
    </div>
  );
}
