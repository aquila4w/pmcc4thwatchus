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

interface EventData {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  eventDate: string;
  endDate?: string;
  location: string;
  address: string;
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
  contactEmail: string | null;
  contactPhone: string | null;
  puckData: unknown | null;
  createdAt: string;
  updatedAt: string;
}

// Fallback event data
const fallbackEvent: EventData = {
  id: "fallback",
  title: "Spiritual Empowerment Conference",
  subtitle: "Day 1: Apostolic Worship & Faith",
  slug: "spiritual-empowerment-day-1",
  description: `Join us for a powerful day of worship, teaching, and spiritual empowerment. This conference is designed to help believers grow deeper in their faith and understanding of apostolic principles.

Experience transformative worship sessions led by anointed ministers from across the district. Learn practical applications of faith that will strengthen your walk with God.

Whether you're a new believer or have been walking with the Lord for years, this conference offers something for everyone.`,
  eventDate: "2026-03-15T09:00:00",
  endDate: "2026-03-15T17:00:00",
  location: "Los Angeles Convention Center",
  address: "1201 S Figueroa St, Los Angeles, CA 90015",
  eventType: "conference",
  isPublished: true,
  isFeatured: true,
  heroImage: {
    url: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=1200&q=80",
    alt: "Conference gathering",
  },
  featuredImage: null,
  gallery: [
    {
      url: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200&q=80",
      alt: "Worship service",
      caption: "Powerful worship sessions",
    },
    {
      url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&q=80",
      alt: "Community gathering",
      caption: "Fellowship and community",
    },
    {
      url: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&q=80",
      alt: "Prayer time",
      caption: "Dedicated prayer sessions",
    },
  ],
  organizer: {
    id: "1",
    name: "PMCC 4th Watch US District",
  },
  tags: [],
  categories: [],
  contactEmail: "events@pmcc4thwatch.us",
  contactPhone: "+1 (213) 555-0123",
  puckData: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Helper functions
function formatEventDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventTime(dateString: string, endDateString?: string) {
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
    return `${formatEventDate(dateString)} - ${formatEventDate(endDateString)}`;
  }

  return startTime;
}

function getCategoryLabel(eventType: string) {
  const labels: Record<string, string> = {
    event: "Event",
    news: "News",
    announcement: "Announcement",
    conference: "Conference",
    training: "Training",
    worship: "Worship",
    leadership: "Leadership",
    prayer: "Prayer",
    crusade: "Crusade",
    youth: "Youth",
  };
  return labels[eventType] || "Event";
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

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch event data
  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/news-events/${slug}`);
        if (!response.ok) {
          throw new Error("Event not found");
        }
        const data = await response.json();
        setEvent(data.event);
      } catch (error) {
        console.error("Error fetching event:", error);
        // Use fallback data
        setEvent({ ...fallbackEvent, slug });
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [slug]);

  const shareEvent = () => {
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

  if (!event) {
    return (
      <main className="min-h-screen bg-[#f8f6f3] dark:bg-[#0a0f1a]">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="font-serif text-3xl font-bold text-[#0a0f1a] dark:text-white mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-8">The event you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/events">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Link>
          </Button>
        </div>
        <Footer />
      </main>
    );
  }

  // Combine all images for carousel
  const carouselImages: GalleryImage[] = [
    ...(event.heroImage ? [{ ...event.heroImage, caption: "" }] : []),
    ...(event.featuredImage ? [{ ...event.featuredImage, caption: "" }] : []),
    ...event.gallery,
  ];

  return (
    <main className="min-h-screen bg-[#f8f6f3] dark:bg-[#0a0f1a]">
      <Header />

      {/* Hero Section - Following other pages' pattern */}
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
              href="/events"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </Link>

            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className="bg-secondary text-[#0a0f1a]">
                  {getCategoryLabel(event.eventType)}
                </Badge>
                {event.isFeatured && (
                  <Badge variant="outline" className="border-secondary text-secondary">
                    Featured
                  </Badge>
                )}
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-[1.1]">
                {event.title}
              </h1>

              {event.subtitle && (
                <p className="text-white/70 text-xl md:text-2xl mb-8">
                  {event.subtitle}
                </p>
              )}

              <div className="flex flex-wrap gap-6 text-white/60">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary" />
                  {formatEventDate(event.eventDate)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-secondary" />
                  {formatEventTime(event.eventDate, event.endDate)}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-secondary" />
                  {event.location}
                </span>
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
                  <ImageCarousel images={carouselImages} title={event.title} />
                </motion.div>
              )}

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-8 shadow-sm"
              >
                <h2 className="font-serif text-2xl font-bold text-[#0a0f1a] dark:text-white mb-6">
                  About This Event
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none text-[#0a0f1a]/70 dark:text-white/70">
                  {event.description.split("\n\n").map((paragraph, index) => (
                    <p key={index} className="mb-4 last:mb-0">{paragraph}</p>
                  ))}
                </div>
              </motion.div>

              {/* Tags */}
              {event.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-wrap gap-2"
                >
                  {event.tags.map((tag) => (
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
              {/* Event Details Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-6 shadow-sm sticky top-24"
              >
                {/* Organizer */}
                {event.organizer && (
                  <div className="mb-6">
                    <span className="text-sm text-[#0a0f1a]/60 dark:text-white/60">Organized by</span>
                    <p className="font-semibold text-[#0a0f1a] dark:text-white">{event.organizer.name}</p>
                  </div>
                )}

                {/* Date & Time */}
                <div className="space-y-4 mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
                  <div>
                    <h3 className="font-semibold text-[#0a0f1a] dark:text-white mb-2 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-secondary" />
                      Date & Time
                    </h3>
                    <p className="text-[#0a0f1a]/70 dark:text-white/70">
                      {formatEventDate(event.eventDate)}
                    </p>
                    <p className="text-[#0a0f1a]/70 dark:text-white/70">
                      {formatEventTime(event.eventDate, event.endDate)}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
                  <h3 className="font-semibold text-[#0a0f1a] dark:text-white mb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-secondary" />
                    Location
                  </h3>
                  <p className="font-medium text-[#0a0f1a] dark:text-white">{event.location}</p>
                  {event.address && (
                    <p className="text-[#0a0f1a]/70 dark:text-white/70 text-sm mt-1">{event.address}</p>
                  )}
                  {event.address && (
                    <Button variant="outline" className="w-full mt-4" asChild>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Get Directions
                      </a>
                    </Button>
                  )}
                </div>

                {/* Contact */}
                {(event.contactEmail || event.contactPhone) && (
                  <div className="mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
                    <h3 className="font-semibold text-[#0a0f1a] dark:text-white mb-3">Contact</h3>
                    <div className="space-y-2">
                      {event.contactEmail && (
                        <a
                          href={`mailto:${event.contactEmail}`}
                          className="flex items-center gap-2 text-sm text-[#0a0f1a]/70 dark:text-white/70 hover:text-primary transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {event.contactEmail}
                        </a>
                      )}
                      {event.contactPhone && (
                        <a
                          href={`tel:${event.contactPhone}`}
                          className="flex items-center gap-2 text-sm text-[#0a0f1a]/70 dark:text-white/70 hover:text-primary transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {event.contactPhone}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Share */}
                <div>
                  <h3 className="font-semibold text-[#0a0f1a] dark:text-white mb-3">Share This Event</h3>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={shareEvent}
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
                Discover More Events
              </h2>
              <p className="text-white/60 mb-8">
                Explore our upcoming events and find opportunities to connect, worship, and grow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                  <Link href="/events">
                    View All Events
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
