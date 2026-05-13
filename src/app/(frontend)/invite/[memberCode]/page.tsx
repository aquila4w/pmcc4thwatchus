"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Phone,
  ArrowRight,
  Loader2,
  AlertCircle,
  Home,
  Church,
  Users,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MemberInfo {
  name: string;
  phone: string;
  church: string | null;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  location: string;
  eventType: string;
  spotsRemaining: number | null;
  heroImageUrl: string | null;
}

interface InviteData {
  member: MemberInfo;
  events: Event[];
}

export default function InvitePage({ params }: { params: Promise<{ memberCode: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/invite/${resolvedParams.memberCode}`);

        if (!response.ok) {
          throw new Error("Invalid invite link");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError("This invite link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.memberCode]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0f1a]">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto bg-white/5 border-white/10 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-white mb-2">
              Invalid Invite Link
            </h1>
            <p className="text-white/60 mb-6">{error}</p>
            <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Visit Our Website
              </Link>
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-secondary mb-4">
              <Heart className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wider font-semibold">You're Invited</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
              Welcome to PMCC 4th Watch
            </h1>
            <p className="text-white/60 text-lg">
              You've been personally invited to our upcoming events
            </p>
          </div>

          {/* Member Card */}
          <Card className="bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/30 p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                <User className="w-8 h-8 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-sm mb-1">Invited by</p>
                <h2 className="text-white text-xl font-semibold">{data.member.name}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  {data.member.church && (
                    <span className="text-white/60 text-sm flex items-center gap-1">
                      <Church className="w-4 h-4" />
                      {data.member.church}
                    </span>
                  )}
                  {data.member.phone && (
                    <span className="text-secondary text-sm flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {data.member.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Events List */}
          {data.events.length > 0 ? (
            <>
              <h2 className="text-white/50 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {data.events.map((event) => (
                  <Card
                    key={event.id}
                    className="bg-white/5 border-white/10 overflow-hidden hover:border-secondary/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Event Image */}
                      <div className="md:w-48 h-32 md:h-auto bg-gradient-to-br from-primary/50 to-primary/30 flex-shrink-0">
                        {event.heroImageUrl ? (
                          <img
                            src={event.heroImageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-white/30" />
                          </div>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-primary/20 text-primary-foreground text-xs">
                                {event.eventType.replace("-", " ")}
                              </Badge>
                              {event.spotsRemaining !== null && event.spotsRemaining < 20 && (
                                <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                                  {event.spotsRemaining} spots left
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-white font-serif text-xl font-semibold mb-2">
                              {event.title}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-white/60 text-sm mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(event.startDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(event.startDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-white/50 text-sm line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                            <Link href={`/register/${event.slug}?ref=${resolvedParams.memberCode}`}>
                              Register Now
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="bg-white/5 border-white/10 p-8 text-center">
              <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h2 className="text-xl font-serif font-semibold text-white mb-2">
                No Events Available
              </h2>
              <p className="text-white/60 mb-6">
                There are no events open for registration at the moment. Please check back later!
              </p>
              <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Link href="/">
                  Learn More About Us
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </Card>
          )}

          {/* Info Section */}
          <div className="mt-12 text-center">
            <p className="text-white/40 text-sm">
              Have questions? Contact {data.member.name}
              {data.member.phone && ` at ${data.member.phone}`}
            </p>
          </div>
        </div>
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

function Header() {
  return (
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
  );
}
