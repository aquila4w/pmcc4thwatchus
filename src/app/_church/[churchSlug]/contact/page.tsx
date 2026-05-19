"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Navigation,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChurchSiteData } from "@/lib/church-site-types";
import { TEMPLATES } from "@/lib/church-site-types";

export default function ChurchContactPage({
  params,
}: {
  params: Promise<{ churchSlug: string }>;
}) {
  const { churchSlug } = use(params);
  const [data, setData] = useState<ChurchSiteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/church-site/${churchSlug}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [churchSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!data?.site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="p-12 text-center max-w-lg mx-4">
          <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-bold text-slate-800 mb-4">Not Found</h1>
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const { site, church } = data;
  const t = TEMPLATES[site.template] || TEMPLATES.modern;
  const locationQuery = church.address || `${church.city}, ${church.state}`;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className={`${t.headerBg} border-b border-white/10`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10">
              <span className="text-white font-serif font-bold text-sm">P</span>
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
            <Link href="/contact" className="text-white font-medium text-sm">Contact</Link>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <section className={`${t.heroGradient} py-16`}>
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className={`${t.fontSerif} text-4xl md:text-5xl font-bold text-white`}>Contact Us</h1>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className={`${t.fontSerif} text-2xl font-bold ${t.primaryText} mb-6`}>Get In Touch</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  We would love to hear from you! Whether you have a question about our church,
                  services, or anything else, feel free to reach out.
                </p>
              </div>

              <div className="space-y-6">
                {church.address && (
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${t.primaryBg} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                      <MapPin className={`w-5 h-5 ${t.accentText}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Address</h3>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">
                        {church.address}<br />
                        {church.city}, {church.state} {church.zip}
                      </p>
                    </div>
                  </div>
                )}

                {church.phone && (
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${t.primaryBg} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                      <Phone className={`w-5 h-5 ${t.accentText}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Phone</h3>
                      <a href={`tel:${church.phone}`} className="text-slate-600 dark:text-slate-300 mt-1 block hover:text-slate-900 dark:hover:text-white">
                        {church.phone}
                      </a>
                    </div>
                  </div>
                )}

                {church.email && (
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${t.primaryBg} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                      <Mail className={`w-5 h-5 ${t.accentText}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Email</h3>
                      <a href={`mailto:${church.email}`} className="text-slate-600 dark:text-slate-300 mt-1 block hover:text-slate-900 dark:hover:text-white">
                        {church.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <Button
                asChild
                className={`${t.accentBg} text-white hover:opacity-90`}
              >
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </a>
              </Button>
            </div>

            {/* Map */}
            <div>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-[400px]">
                <iframe
                  sandbox="allow-scripts allow-same-origin"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(locationQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Church location"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${t.footerBg} border-t border-white/10`}>
        <div className="container mx-auto px-4 py-6">
          <p className="text-white/30 text-sm text-center">
            &copy; {new Date().getFullYear()} {church.name} &mdash; PMCC 4th Watch US District
          </p>
        </div>
      </footer>
    </div>
  );
}
