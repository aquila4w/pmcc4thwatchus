"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, MapPin, ArrowUpRight } from "lucide-react";

// Event image component with error handling
function EventImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError) {
    // Fallback gradient when image fails to load
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/30" />
    );
  }

  // Disable Next.js Image optimization for all external URLs to avoid issues
  const isExternal = src.startsWith("http://") || src.startsWith("https://");
  const isLocalPayload = src.startsWith("/payload-api/");

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      loading="lazy"
      unoptimized={isExternal || isLocalPayload}
      onError={() => setHasError(true)}
    />
  );
}

interface EventData {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  startDate: string;
  location: string;
  heroImage: {
    url: string;
    alt: string;
  } | null;
  eventType: string;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    color: string;
  }>;
}

// Fallback static data in case API fails or no events in DB
const fallbackEvents: EventData[] = [
  {
    id: "1",
    title: "Spiritual Empowerment",
    subtitle: "Day 1: Apostolic Worship & Faith",
    slug: "spiritual-empowerment-day-1",
    startDate: "2026-03-15T09:00:00",
    location: "Los Angeles, CA",
    heroImage: {
      url: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80",
      alt: "Spiritual Empowerment Conference",
    },
    eventType: "conference",
    tags: [],
  },
  {
    id: "2",
    title: "Soul Winning Summit",
    subtitle: "Apostolic Evangelism Training",
    slug: "soul-winning-summit",
    startDate: "2026-03-16T10:00:00",
    location: "San Francisco, CA",
    heroImage: {
      url: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80",
      alt: "Soul Winning Summit",
    },
    eventType: "training",
    tags: [],
  },
  {
    id: "3",
    title: "Pastoral Leadership",
    subtitle: "Day 3: Apostolic Pastoring",
    slug: "pastoral-leadership",
    startDate: "2026-03-17T09:00:00",
    location: "San Diego, CA",
    heroImage: {
      url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
      alt: "Pastoral Leadership Workshop",
    },
    eventType: "leadership",
    tags: [],
  },
  {
    id: "4",
    title: "Prayer Warriors",
    subtitle: "Apostolic Prayer Methods",
    slug: "prayer-warriors",
    startDate: "2026-03-18T18:00:00",
    location: "Sacramento, CA",
    heroImage: {
      url: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80",
      alt: "Prayer Warriors Conference",
    },
    eventType: "prayer",
    tags: [],
  },
];

// Helper function to format date
function formatEventDate(dateString: string) {
  const date = new Date(dateString);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return { month, day: day.toString(), year: year.toString() };
}

// Helper function to get category label
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
  };
  return labels[eventType] || "Event";
}

export function EventsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<EventData[]>(fallbackEvents);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

  // Fetch events from API - silently update if available
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/news-events?homepage=true&limit=8&type=event");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          setEvents(data.items);
        }
        // If no events, keep fallback data
      } catch (error) {
        // Silently keep fallback data on error - no console.error needed
      }
    }

    fetchEvents();
  }, []);

  return (
    <section ref={containerRef} className="relative bg-stone-300/80 dark:bg-[#0a0f1a] transition-colors duration-300">
      {/* Header Section */}
      <div className="relative py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4"
              >
                Upcoming And Past Events
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-[#0a0f1a] dark:text-white leading-[1.1]"
              >
                News &<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Events</span>
              </motion.h2>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link
                href="/news-events"
                className="inline-flex items-center gap-3 px-6 py-4 bg-[#0a0f1a] dark:bg-white text-white dark:text-[#0a0f1a] rounded-full group hover:bg-primary dark:hover:bg-secondary transition-colors duration-300"
              >
                <span className="font-medium">View All News & Events</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {events.slice(0, 4).map((event, index) => {
                const dateInfo = formatEventDate(event.startDate);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Link href={`/news-events/${event.slug}`} className="group block">
                      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1a1f2e]">
                        {/* Image Container */}
                        <div className="relative aspect-[16/10] overflow-hidden">
                          {event.heroImage ? (
                            <EventImage
                              src={event.heroImage.url}
                              alt={event.heroImage.alt || event.title}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                          {/* Category Badge */}
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1.5 bg-secondary text-[#0a0f1a] text-xs font-bold uppercase tracking-wider rounded-full">
                              {getCategoryLabel(event.eventType)}
                            </span>
                          </div>

                          {/* Date Badge */}
                          <div className="absolute top-4 right-4 text-right">
                            <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                              <span className="block text-white text-2xl font-bold leading-none">{dateInfo.day}</span>
                              <span className="block text-white/70 text-xs uppercase">{dateInfo.month}</span>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="absolute bottom-4 right-4">
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center group-hover:bg-secondary transition-colors duration-300">
                              <ArrowUpRight className="w-5 h-5 text-[#0a0f1a] group-hover:rotate-45 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="font-serif text-2xl font-bold text-[#0a0f1a] dark:text-white mb-2 group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-[#0a0f1a]/60 dark:text-white/60 mb-4">{event.subtitle}</p>
                          <div className="flex items-center gap-4 text-sm text-[#0a0f1a]/50 dark:text-white/50">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {dateInfo.month} {dateInfo.day}, {dateInfo.year}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
        </div>
      </div>

      {/* Marquee Section */}
      <div className="relative py-12 bg-slate-300 dark:bg-[#0a0f1a] overflow-hidden transition-colors duration-300">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center mx-8">
              <span className="text-4xl md:text-6xl font-serif font-bold text-slate-400/30 dark:text-white/10 mx-4">HOME FREE GLOBAL CRUSADES</span>
              <span className="text-secondary text-4xl">+</span>
              <span className="text-4xl md:text-6xl font-serif font-bold text-slate-400/30 dark:text-white/10 mx-4">SPIRITUAL EMPOWERMENT</span>
              <span className="text-secondary text-4xl">+</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
