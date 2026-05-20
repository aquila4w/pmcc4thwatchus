"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChurchSiteData } from "@/lib/church-site-types";
import { TEMPLATES } from "@/lib/church-site-types";

export default function ChurchEventsPage({
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
  const updates = site.latestUpdates || [];

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
            <Link href="/events" className="text-white font-medium text-sm">Events</Link>
            <Link href="/gallery" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Gallery</Link>
            <Link href="/contact" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Contact</Link>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <section className={`${t.heroGradient} py-16`}>
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className={`${t.fontSerif} text-4xl md:text-5xl font-bold text-white`}>Events & Updates</h1>
        </div>
      </section>

      {/* Events Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {updates.length > 0 ? (
              <div className="grid gap-6">
                {updates.map((update, i) => (
                  <Card key={i} className={`${t.cardBg} ${t.cardBorder} border overflow-hidden`}>
                    <div className="flex flex-col md:flex-row">
                      {update.image?.url && (
                        <div className="md:w-64 flex-shrink-0">
                          <img
                            src={update.image.url}
                            alt={update.title}
                            className="w-full h-48 md:h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6 flex-1">
                        {update.date && (
                          <p className="text-slate-400 text-sm mb-2">
                            {new Date(update.date).toLocaleDateString("en-US", {
                              year: "numeric", month: "long", day: "numeric",
                            })}
                          </p>
                        )}
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                          {update.title}
                        </h3>
                        {update.content && (
                          <p className="text-slate-500 dark:text-slate-400">
                            {update.content}
                          </p>
                        )}
                        {update.link && (
                          <a
                            href={update.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 text-sm mt-4 hover:underline ${t.accentText}`}
                          >
                            Learn more <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  No Events Yet
                </h3>
                <p className="text-slate-500">
                  Check back soon for events and updates at {church.name}.
                </p>
              </div>
            )}

            {/* Link to district events */}
            <div className="mt-12 text-center">
              <p className="text-slate-500 text-sm mb-3">
                Looking for more events? Check the district calendar.
              </p>
              <Button asChild variant="outline">
                <a href="https://pmcc4thwatch.us/news-events" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  District Events & News
                </a>
              </Button>
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
