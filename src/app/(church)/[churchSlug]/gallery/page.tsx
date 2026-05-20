"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChurchSiteData } from "@/lib/church-site-types";
import { TEMPLATES } from "@/lib/church-site-types";

export default function ChurchGalleryPage({
  params,
}: {
  params: Promise<{ churchSlug: string }>;
}) {
  const { churchSlug } = use(params);
  const [data, setData] = useState<ChurchSiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

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
  const images = site.gallery || [];

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImage === null) return;
    if (direction === "prev") {
      setSelectedImage(selectedImage > 0 ? selectedImage - 1 : images.length - 1);
    } else {
      setSelectedImage(selectedImage < images.length - 1 ? selectedImage + 1 : 0);
    }
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
            <Link href="/about" className="text-white/80 hover:text-white text-sm font-medium transition-colors">About</Link>
            <Link href="/events" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Events</Link>
            <Link href="/gallery" className="text-white font-medium text-sm">Gallery</Link>
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
          <h1 className={`${t.fontSerif} text-4xl md:text-5xl font-bold text-white`}>Gallery</h1>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {images.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
                >
                  <img
                    src={item.image.url}
                    alt={item.caption || `Gallery image ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-white text-sm">{item.caption}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No Photos Yet
              </h3>
              <p className="text-slate-500">
                Photos will be added soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage !== null && images[selectedImage] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); navigateImage("prev"); }}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); navigateImage("next"); }}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
          <img
            src={images[selectedImage].image.url}
            alt={images[selectedImage].caption || "Gallery image"}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images[selectedImage].caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-center">
              {images[selectedImage].caption}
            </p>
          )}
        </div>
      )}

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
