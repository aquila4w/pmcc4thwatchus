"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChurchSiteData } from "@/lib/church-site-types";
import { TEMPLATES } from "@/lib/church-site-types";

export default function ChurchAboutPage({
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

  const sanitize = (html: unknown) => {
    if (typeof html !== "string") return "";
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["h1","h2","h3","h4","h5","h6","p","br","strong","em","b","i","u","a","ul","ol","li","blockquote","hr","span","div","img","table","thead","tbody","tr","th","td"],
      ALLOWED_ATTR: ["href","target","rel","src","alt","class","style"],
      ALLOW_DATA_ATTR: false,
    });
  };

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
            <Link href="/about" className="text-white font-medium text-sm">About</Link>
            <Link href="/events" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Events</Link>
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
          <h1 className={`${t.fontSerif} text-4xl md:text-5xl font-bold text-white`}>About Us</h1>
        </div>
      </section>

      {/* About Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            {/* Main About */}
            {site.aboutContent ? (
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitize(site.aboutContent) }}
              />
            ) : null}

            {/* History */}
            {site.history ? (
              <div>
                <h2 className={`${t.fontSerif} text-2xl font-bold ${t.primaryText} mb-4`}>Our History</h2>
                <div
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitize(site.history) }}
                />
              </div>
            ) : null}

            {/* Beliefs */}
            {site.beliefs ? (
              <div>
                <h2 className={`${t.fontSerif} text-2xl font-bold ${t.primaryText} mb-4`}>Our Beliefs</h2>
                <div
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitize(site.beliefs) }}
                />
              </div>
            ) : null}

            {/* Fallback if no content */}
            {!site.aboutContent && !site.history && !site.beliefs ? (
              <div className="text-center py-12">
                <p className="text-slate-500">Content coming soon.</p>
              </div>
            ) : null}
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
