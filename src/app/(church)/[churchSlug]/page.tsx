"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import DOMPurify from "dompurify";
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  ChevronRight,
  Loader2,
  AlertCircle,
  Globe,
  Instagram,
  Youtube,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChurchSiteData } from "@/lib/church-site-types";
import { TEMPLATES } from "@/lib/church-site-types";

const safeUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) return undefined;
    return url;
  } catch {
    return undefined;
  }
};

const DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABELS: Record<string, string> = {
  sunday: "Sunday", monday: "Monday", tuesday: "Tuesday",
  wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday",
};

export default function ChurchHomePage({
  params,
}: {
  params: Promise<{ churchSlug: string }>;
}) {
  const { churchSlug } = use(params);
  const [data, setData] = useState<ChurchSiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/church-site/${churchSlug}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        if (json.error && !json.published) {
          setData(null);
          setError("coming-soon");
          return;
        }
        setData(json);
      } catch {
        setError("not-found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [churchSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1209]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <img src="/images/logo-white.png" alt="PMCC 4th Watch" className="w-full h-full object-contain" />
          </div>
          <Loader2 className="w-8 h-8 text-amber-500/50 animate-spin mx-auto mb-4" />
          <p className="text-amber-200/40 text-sm tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  if (error === "coming-soon") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1209] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(180,130,50,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B48232' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative text-center max-w-lg mx-6 px-8 py-16">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/images/logo-white.png" alt="PMCC 4th Watch" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <p className="text-amber-200/70 font-serif text-sm font-medium tracking-wide">PMCC 4th Watch</p>
              <p className="text-amber-200/30 text-[10px] tracking-[0.25em] uppercase">US District</p>
            </div>
          </div>
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Globe className="w-9 h-9 text-amber-400/70" />
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-amber-50 mb-4 tracking-tight">Coming Soon</h1>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-6" />
            <p className="text-amber-200/50 text-lg leading-relaxed">
              This church website is being set up.<br />Check back soon!
            </p>
          </div>
          <Button asChild className="bg-amber-700/80 hover:bg-amber-600 text-white font-medium px-8 py-6 text-base rounded-full shadow-lg shadow-amber-900/30 border border-amber-500/20">
            <Link href="https://pmcc4thwatch.us">
              <ExternalLink className="w-4 h-4 mr-2" />
              Visit PMCC 4th Watch
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1209] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(180,130,50,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B48232' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative text-center max-w-lg mx-6 px-8 py-16">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/images/logo-white.png" alt="PMCC 4th Watch" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <p className="text-amber-200/70 font-serif text-sm font-medium tracking-wide">PMCC 4th Watch</p>
              <p className="text-amber-200/30 text-[10px] tracking-[0.25em] uppercase">US District</p>
            </div>
          </div>
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-9 h-9 text-amber-400/70" />
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-amber-50 mb-4 tracking-tight">Church Not Found</h1>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-6" />
            <p className="text-amber-200/50 text-lg leading-relaxed">
              We couldn't find this church.<br />Please check the URL and try again.
            </p>
          </div>
          <Button asChild className="bg-amber-700/80 hover:bg-amber-600 text-white font-medium px-8 py-6 text-base rounded-full shadow-lg shadow-amber-900/30 border border-amber-500/20">
            <Link href="https://pmcc4thwatch.us">
              <ExternalLink className="w-4 h-4 mr-2" />
              Visit PMCC 4th Watch
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { site, church } = data;
  const t = TEMPLATES[site.template] || TEMPLATES.modern;
  const primaryColor = site.customColors?.primaryColor;
  const accentColor = site.customColors?.accentColor;

  const sortedSchedule = [...(site.serviceSchedule || [])].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  );

  const heroImageUrl = site.heroImage?.url || church.image?.url;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${t.headerBg} ${isScrolled ? 'py-2 shadow-lg' : 'py-4 border-b border-white/10'}`}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/images/logo-white.png" alt="PMCC 4th Watch" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-white font-serif text-lg font-semibold">{church.name}</span>
              <span className="text-white/50 text-xs block tracking-[0.2em] uppercase">PMCC 4th Watch</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Home</Link>
            <Link href="/about" className="text-white/80 hover:text-white text-sm font-medium transition-colors">About</Link>
            <Link href="/events" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Events</Link>
            <Link href="/gallery" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Gallery</Link>
            <Link href="/contact" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Contact</Link>
            <a
              href="https://pmcc4thwatch.us"
              className="text-white/50 hover:text-white text-xs transition-colors"
            >
              pmcc4thwatch.us
            </a>
          </nav>
          {/* Mobile menu button */}
          <Link
            href="https://pmcc4thwatch.us"
            className="md:hidden text-white/50 hover:text-white text-xs transition-colors"
          >
            pmcc4thwatch.us
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`relative bg-gradient-to-r ${t.heroGradient} overflow-hidden pt-20`}>
        {heroImageUrl && (
          <div className="absolute inset-0">
            <img src={heroImageUrl} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
          </div>
        )}
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {site.welcomeTitle || "Welcome"}
            </h1>
            {site.missionStatement && (
              <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-8">
                {site.missionStatement}
              </p>
            )}
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className={`${t.accentBg} hover:opacity-90 text-white`}>
                <Link href="/contact">
                  <MapPin className="w-5 h-5 mr-2" />
                  Visit Us
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Link href="/about">
                  Learn More
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Service Schedule */}
      {sortedSchedule.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className={`${t.fontSerif} text-3xl font-bold ${t.primaryText} text-center mb-12`}>
              Service Schedule
            </h2>
            <div className="max-w-2xl mx-auto">
              <Card className={`${t.cardBg} ${t.cardBorder} border overflow-hidden`}>
                <table className="w-full">
                  <tbody>
                    {sortedSchedule.map((service, i) => (
                      <tr
                        key={i}
                        className={`border-b last:border-b-0 ${t.cardBorder.replace('border', 'border-b')}`}
                      >
                        <td className="py-4 px-6 font-medium text-slate-900 dark:text-white w-32">
                          {DAY_LABELS[service.day] || service.day}
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                          {service.serviceName}
                        </td>
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-right whitespace-nowrap">
                          <Clock className="w-4 h-4 inline mr-2" />
                          {service.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Pastors Section */}
      {site.pastors && site.pastors.length > 0 && (
        <section className={`py-16 ${t.sectionAlt}`}>
          <div className="container mx-auto px-4">
            <h2 className={`${t.fontSerif} text-3xl font-bold ${t.primaryText} text-center mb-12`}>
              {site.pastors.length === 1 ? "Our Pastor" : "Our Pastors"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {site.pastors.map((pastor, i) => (
                <div key={i} className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    {pastor.photo?.url ? (
                      <img
                        src={pastor.photo.url}
                        alt={pastor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{pastor.name}</h3>
                  {pastor.title && (
                    <p className={`${t.accentText} text-sm mt-1`}>{pastor.title}</p>
                  )}
                  {pastor.bio && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                      {pastor.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Map / Visit Us Section */}
      {(church.address || church.city) && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className={`${t.fontSerif} text-3xl font-bold ${t.primaryText} text-center mb-12`}>
              Visit Us
            </h2>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-[300px]">
                  <iframe
                    sandbox="allow-scripts allow-same-origin"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      church.address || `${church.city}, ${church.state}`
                    )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Church location"
                    className="w-full h-full"
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    church.address || `${church.city}, ${church.state}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm mt-3 hover:underline"
                  style={{ color: accentColor || undefined }}
                >
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </a>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Address</h3>
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{church.address}</p>
                      <p>{church.city}, {church.state} {church.zip}</p>
                    </div>
                  </div>
                </div>
                {church.phone && (
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Phone</h3>
                    <a
                      href={`tel:${church.phone}`}
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Phone className="w-5 h-5" />
                      {church.phone}
                    </a>
                  </div>
                )}
                {church.email && (
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Email</h3>
                    <a
                      href={`mailto:${church.email}`}
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Mail className="w-5 h-5" />
                      {church.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Updates */}
      {site.latestUpdates && site.latestUpdates.length > 0 && (
        <section className={`py-16 ${t.sectionAlt}`}>
          <div className="container mx-auto px-4">
            <h2 className={`${t.fontSerif} text-3xl font-bold ${t.primaryText} text-center mb-12`}>
              Latest Updates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {site.latestUpdates.slice(0, 6).map((update, i) => (
                <Card key={i} className={`${t.cardBg} ${t.cardBorder} border overflow-hidden`}>
                  {update.image?.url && (
                    <img
                      src={update.image.url}
                      alt={update.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    {update.date && (
                      <p className="text-slate-400 text-sm mb-2">
                        {new Date(update.date).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </p>
                    )}
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                      {update.title}
                    </h3>
                    {update.content && (
                      <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3">
                        {update.content}
                      </p>
                    )}
                    {update.link && safeUrl(update.link) && (
                      <a
                        href={safeUrl(update.link)}
                        className={`inline-flex items-center gap-1 text-sm mt-3 hover:underline ${t.accentText}`}
                      >
                        Read more <ChevronRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className={`${t.footerBg} border-t border-white/10`}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-serif text-lg font-semibold mb-4">{church.name}</h3>
              <p className="text-white/50 text-sm">
                Pentecostal Missionary Church of Christ (4th Watch)
              </p>
              {church.address && (
                <p className="text-white/40 text-sm mt-2">
                  {church.address}<br />
                  {church.city}, {church.state} {church.zip}
                </p>
              )}
            </div>
            <div>
              <h4 className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-4">Pages</h4>
              <div className="space-y-2">
                <Link href="/" className="block text-white/50 hover:text-white text-sm transition-colors">Home</Link>
                <Link href="/about" className="block text-white/50 hover:text-white text-sm transition-colors">About</Link>
                <Link href="/events" className="block text-white/50 hover:text-white text-sm transition-colors">Events</Link>
                <Link href="/gallery" className="block text-white/50 hover:text-white text-sm transition-colors">Gallery</Link>
                <Link href="/contact" className="block text-white/50 hover:text-white text-sm transition-colors">Contact</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-4">Connect</h4>
              <div className="space-y-2">
                {site.socialLinks?.facebook && safeUrl(site.socialLinks.facebook) && (
                  <a href={safeUrl(site.socialLinks.facebook)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
                    <Globe className="w-4 h-4" /> Facebook
                  </a>
                )}
                {site.socialLinks?.instagram && safeUrl(site.socialLinks.instagram) && (
                  <a href={safeUrl(site.socialLinks.instagram)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
                    <Instagram className="w-4 h-4" /> Instagram
                  </a>
                )}
                {site.socialLinks?.youtube && safeUrl(site.socialLinks.youtube) && (
                  <a href={safeUrl(site.socialLinks.youtube)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
                    <Youtube className="w-4 h-4" /> YouTube
                  </a>
                )}
                {site.socialLinks?.website && safeUrl(site.socialLinks.website) && (
                  <a href={safeUrl(site.socialLinks.website)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
                    <ExternalLink className="w-4 h-4" /> Website
                  </a>
                )}
                <a href="https://pmcc4thwatch.us" className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
                  <ExternalLink className="w-4 h-4" /> US District
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-white/30 text-sm">
                &copy; {new Date().getFullYear()} Pentecostal Missionary Church of Christ (4th Watch) US District | US IT &amp; Website Team. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <a href="https://pmcc4thwatch.us/privacy-policy" className="text-white/30 hover:text-white/60 transition-colors">Privacy Policy</a>
                <a href="https://pmcc4thwatch.us/terms" className="text-white/30 hover:text-white/60 transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
