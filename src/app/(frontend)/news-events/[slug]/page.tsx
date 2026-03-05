"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  ArrowRight,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Loader2,
  X,
  Newspaper,
  User,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GalleryImage {
  url: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
}

interface NewsEventData {
  id: string;
  type: "news" | "event";
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  startDate?: string;
  endDate?: string;
  newsDate?: string;
  content?: string;
  location: string;
  address?: string;
  coordinates?: { lat: number; lng: number } | null;
  eventType: string;
  isPublished: boolean;
  isFeatured: boolean;
  heroImage: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  } | null;
  featuredImage: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  } | null;
  gallery: GalleryImage[];
  organizer: {
    id: string;
    name: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    color: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  requiresRegistration?: boolean;
  registrationUrl?: string;
  registrationDeadline?: string;
  maxAttendees?: number;
  registrationNote?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Helper functions
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString: string, endDateString?: string) {
  const startDate = new Date(dateString);
  const startTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (endDateString) {
    const endDate = new Date(endDateString);
    if (startDate.toDateString() === endDate.toDateString()) {
      const endTime = endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return `${startTime} - ${endTime}`;
    }
    return `${formatDate(dateString)} - ${formatDate(endDateString)}`;
  }

  return startTime;
}

function getCategoryLabel(eventType: string) {
  const labels: Record<string, string> = {
    general: "General",
    conference: "Conference",
    training: "Training",
    worship: "Worship",
    crusade: "Crusade",
    youth: "Youth",
    announcement: "Announcement",
  };
  return labels[eventType] || "General";
}

// Image Carousel Component
function ImageCarousel({ images, title }: { images: GalleryImage[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <>
      <div className="relative">
        {/* Main Carousel */}
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 cursor-pointer"
              onClick={() => openLightbox(currentIndex)}
            >
              <Image
                src={images[currentIndex].url}
                alt={images[currentIndex].alt}
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover"
                unoptimized={images[currentIndex].url.startsWith("/payload-api/")}
              />
              {images[currentIndex].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <p className="text-white text-lg">{images[currentIndex].caption}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all z-10"
                type="button"
              >
                <ChevronLeft className="w-6 h-6 text-[#0a0f1a]" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all z-10"
                type="button"
              >
                <ChevronRight className="w-6 h-6 text-[#0a0f1a]" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
                  index === currentIndex
                    ? "ring-2 ring-secondary ring-offset-2"
                    : "opacity-60 hover:opacity-100"
                }`}
                type="button"
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized={image.url.startsWith("/payload-api/")}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              type="button"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                  type="button"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                  type="button"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}

            <div className="relative max-w-5xl max-h-[85vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <Image
                src={images[lightboxIndex].url}
                alt={images[lightboxIndex].alt}
                width={1200}
                height={800}
                className="object-contain w-full h-auto max-h-[85vh]"
                unoptimized={images[lightboxIndex].url.startsWith("/payload-api/")}
              />
              {images[lightboxIndex].caption && (
                <p className="text-white text-center mt-4 text-lg">{images[lightboxIndex].caption}</p>
              )}
              <p className="text-white/50 text-center mt-2 text-sm">
                {lightboxIndex + 1} / {images.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function NewsEventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [item, setItem] = useState<NewsEventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch data
  useEffect(() => {
    async function fetchItem() {
      try {
        const response = await fetch(`/api/news-events/${slug}`);
        if (!response.ok) {
          throw new Error("Item not found");
        }
        const data = await response.json();
        setItem(data.item);
      } catch (error) {
        console.error("Error fetching item:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [slug]);

  const shareItem = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f6f3] dark:bg-[#0a0f1a]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-secondary" />
        </div>
        <Footer />
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-[#f8f6f3] dark:bg-[#0a0f1a]">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="font-serif text-3xl font-bold text-[#0a0f1a] dark:text-white mb-4">Not Found</h1>
          <p className="text-muted-foreground mb-8">The item you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/news-events">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News & Events
            </Link>
          </Button>
        </div>
        <Footer />
      </main>
    );
  }

  // Combine all images for carousel
  const carouselImages: GalleryImage[] = [
    ...(item.heroImage ? [{ ...item.heroImage, caption: "" }] : []),
    ...(item.featuredImage ? [{ ...item.featuredImage, caption: "" }] : []),
    ...item.gallery,
  ];

  return (
    <main className="min-h-screen bg-[#f8f6f3] dark:bg-[#0a0f1a]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-[#0a0f1a] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/news-events"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to News & Events
            </Link>

            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className={item.type === "news" ? "bg-blue-500 text-white" : "bg-secondary text-[#0a0f1a]"}>
                  {item.type === "news" ? <><Newspaper className="w-3 h-3 mr-1" /> News</> : <><Calendar className="w-3 h-3 mr-1" /> Event</>}
                </Badge>
                <Badge variant="outline" className="border-white/20 text-white/70">
                  {getCategoryLabel(item.eventType)}
                </Badge>
                {item.isFeatured && (
                  <Badge variant="outline" className="border-secondary text-secondary">
                    Featured
                  </Badge>
                )}
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-[1.1]">
                {item.title}
              </h1>

              {item.subtitle && (
                <p className="text-white/70 text-xl md:text-2xl mb-8">
                  {item.subtitle}
                </p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-6 text-white/60">
                {item.type === "event" && item.startDate && (
                  <>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-secondary" />
                      {formatDate(item.startDate)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-secondary" />
                      {formatTime(item.startDate, item.endDate)}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-secondary" />
                      {item.location}
                    </span>
                  </>
                )}
                {item.type === "news" && item.newsDate && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    {formatDate(item.newsDate)}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Image Carousel */}
              {carouselImages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <ImageCarousel images={carouselImages} title={item.title} />
                </motion.div>
              )}

              {/* Description/Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-8 shadow-sm"
              >
                <h2 className="font-serif text-2xl font-bold text-[#0a0f1a] dark:text-white mb-6">
                  {item.type === "news" ? "Article" : "About This Event"}
                </h2>
                {item.type === "news" && item.content ? (
                  <div className="prose prose-lg dark:prose-invert max-w-none text-[#0a0f1a]/70 dark:text-white/70 whitespace-pre-line">
                    {item.content}
                  </div>
                ) : (
                  <div className="prose prose-lg dark:prose-invert max-w-none text-[#0a0f1a]/70 dark:text-white/70">
                    {item.description.split("\n\n").map((paragraph, index) => (
                      <p key={index} className="mb-4 last:mb-0">{paragraph}</p>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-wrap gap-2"
                >
                  {item.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-sm"
                      style={{
                        borderColor: tag.color || undefined,
                        color: tag.color || undefined,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Details Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-6 shadow-sm sticky top-24"
              >
                {/* Organizer */}
                {item.organizer && (
                  <div className="mb-6">
                    <span className="text-sm text-[#0a0f1a]/60 dark:text-white/60">Organized by</span>
                    <p className="font-semibold text-[#0a0f1a] dark:text-white">{item.organizer.name}</p>
                  </div>
                )}

                {/* Date & Time (Events only) */}
                {item.type === "event" && item.startDate && (
                  <div className="space-y-4 mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
                    <div>
                      <h3 className="font-semibold text-[#0a0f1a] dark:text-white mb-2 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-secondary" />
                        Date & Time
                      </h3>
                      <p className="text-[#0a0f1a]/70 dark:text-white/70">
                        {formatDate(item.startDate)}
                      </p>
                      <p className="text-[#0a0f1a]/70 dark:text-white/70">
                        {formatTime(item.startDate, item.endDate)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location (Events only) */}
                {item.type === "event" && (
                  <div className="mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
                    <h3 className="font-semibold text-[#0a0f1a] dark:text-white mb-2 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-secondary" />
                      Location
                    </h3>
                    <p className="font-medium text-[#0a0f1a] dark:text-white">{item.location}</p>
                    {item.address && (
                      <p className="text-[#0a0f1a]/70 dark:text-white/70 text-sm mt-1">{item.address}</p>
                    )}
                    {item.address && (
                      <Button variant="outline" className="w-full mt-4" asChild>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(item.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Get Directions
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {/* Registration (Events only) */}
                {item.type === "event" && item.requiresRegistration && (
                  <div className="mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
                    <h3 className="font-semibold text-[#0a0f1a] dark:text-white mb-3">Registration</h3>
                    {item.registrationUrl && (
                      <Button className="w-full mb-3" asChild>
                        <a
                          href={item.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Register Now
                        </a>
                      </Button>
                    )}
                    {item.registrationNote && (
                      <p className="text-sm text-[#0a0f1a]/60 dark:text-white/60 mb-2">
                        {item.registrationNote}
                      </p>
                    )}
                    {item.maxAttendees && (
                      <p className="text-sm text-[#0a0f1a]/60 dark:text-white/60">
                        Max attendees: {item.maxAttendees}
                      </p>
                    )}
                    {item.registrationDeadline && (
                      <p className="text-sm text-[#0a0f1a]/60 dark:text-white/60">
                        Deadline: {formatDate(item.registrationDeadline)}
                      </p>
                    )}
                  </div>
                )}

                {/* Contact */}
                {(item.contactEmail || item.contactPhone) && (
                  <div className="mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
                    <h3 className="font-semibold text-[#0a0f1a] dark:text-white mb-3">Contact</h3>
                    <div className="space-y-2">
                      {item.contactEmail && (
                        <a
                          href={`mailto:${item.contactEmail}`}
                          className="flex items-center gap-2 text-sm text-[#0a0f1a]/70 dark:text-white/70 hover:text-primary transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {item.contactEmail}
                        </a>
                      )}
                      {item.contactPhone && (
                        <a
                          href={`tel:${item.contactPhone}`}
                          className="flex items-center gap-2 text-sm text-[#0a0f1a]/70 dark:text-white/70 hover:text-primary transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {item.contactPhone}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Share */}
                <div>
                  <h3 className="font-semibold text-[#0a0f1a] dark:text-white mb-3">Share</h3>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={shareItem}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0a0f1a]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                Discover More
              </h2>
              <p className="text-white/60 mb-8">
                Explore more news and events from our community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                  <Link href="/news-events">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Link href="/locate">
                    Find a Church
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
