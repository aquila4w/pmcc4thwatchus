"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatEventDate as formatDateUtil, formatEventTimeRange } from "@/lib/event-date";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Search,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  address?: string;
  heroImage: {
    url: string;
    alt: string;
  } | null;
  featuredImage?: {
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
  requiresRegistration: boolean;
  registrationUrl?: string;
  isFeatured?: boolean;
  contactEmail?: string;
  contactPhone?: string;
}

// Fallback static events when API fails or no events in DB
const fallbackEvents: Event[] = [
  {
    id: "1",
    title: "Spiritual Empowerment Conference",
    subtitle: "Day 1: Apostolic Worship & Faith",
    slug: "spiritual-empowerment-day-1",
    description: "Join us for a powerful day of worship and faith building.",
    startDate: "2026-03-15T09:00:00",
    location: "Los Angeles, CA",
    heroImage: {
      url: "https://ext.same-assets.com/99090773/3778162446.jpeg",
      alt: "Spiritual Empowerment Conference",
    },
    eventType: "conference",
    tags: [],
    requiresRegistration: true,
  },
  {
    id: "2",
    title: "Soul Winning Summit",
    subtitle: "Apostolic Evangelism Training",
    slug: "soul-winning-summit",
    description: "Learn effective evangelism methods.",
    startDate: "2026-03-16T10:00:00",
    location: "San Francisco, CA",
    heroImage: {
      url: "https://ext.same-assets.com/99090773/3086591134.jpeg",
      alt: "Soul Winning Summit",
    },
    eventType: "training",
    tags: [],
    requiresRegistration: true,
  },
  {
    id: "3",
    title: "Pastoral Leadership Workshop",
    subtitle: "Day 3: Apostolic Pastoring",
    slug: "pastoral-leadership-workshop",
    description: "A workshop for pastoral development.",
    startDate: "2026-03-17T09:00:00",
    location: "San Diego, CA",
    heroImage: {
      url: "https://ext.same-assets.com/99090773/2311405131.jpeg",
      alt: "Pastoral Leadership Workshop",
    },
    eventType: "leadership",
    tags: [],
    requiresRegistration: true,
  },
  {
    id: "4",
    title: "Prayer Warriors Conference",
    subtitle: "Apostolic Prayer Methods",
    slug: "prayer-warriors-conference",
    description: "Strengthen your prayer life.",
    startDate: "2026-03-18T18:00:00",
    location: "Sacramento, CA",
    heroImage: {
      url: "https://ext.same-assets.com/99090773/1264729597.jpeg",
      alt: "Prayer Warriors Conference",
    },
    eventType: "prayer",
    tags: [],
    requiresRegistration: true,
  },
  {
    id: "5",
    title: "Youth Fellowship Night",
    subtitle: "Connect, Worship, Grow",
    slug: "youth-fellowship-night",
    description: "A night for youth to connect and grow.",
    startDate: "2026-03-20T18:00:00",
    location: "Los Angeles, CA",
    heroImage: {
      url: "https://ext.same-assets.com/99090773/2731046455.jpeg",
      alt: "Youth Fellowship Night",
    },
    eventType: "event",
    tags: [],
    requiresRegistration: false,
  },
  {
    id: "6",
    title: "Home Free Global Crusade",
    subtitle: "Annual District-Wide Crusade",
    slug: "hfgc-2026",
    description: "Our annual crusade event.",
    startDate: "2026-04-05T09:00:00",
    endDate: "2026-04-07T21:00:00",
    location: "Los Angeles, CA",
    heroImage: {
      url: "https://ext.same-assets.com/99090773/3778162446.jpeg",
      alt: "Home Free Global Crusade",
    },
    eventType: "event",
    tags: [],
    requiresRegistration: true,
  },
];

const categories = ["All", "Conference", "Training", "Leadership", "Prayer", "Event", "News", "Worship"];

// Helper functions
function formatEventDate(dateString: string) {
  return formatDateUtil(dateString);
}

function formatEventTime(dateString: string, endDateString?: string) {
  return formatEventTimeRange(dateString, endDateString);
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
  };
  return labels[eventType] || "Event";
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(fallbackEvents);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Fetch events from API
  useEffect(() => {
    async function fetchEvents() {
      try {
        const params = new URLSearchParams({
          published: "true",
        });
        if (selectedCategory !== "All") {
          params.append("category", selectedCategory);
        }
        if (searchQuery) {
          params.append("search", searchQuery);
        }

        const response = await fetch(`/api/events?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        if (data.events && data.events.length > 0) {
          setEvents(data.events);
        } else {
          // Use filtered fallback if no API events
          setEvents(fallbackEvents);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        // Keep fallback data on error
        setEvents(fallbackEvents);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [selectedCategory, searchQuery]);

  // Client-side filtering for fallback data
  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" ||
      getCategoryLabel(event.eventType).toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const featuredEvent = filteredEvents[0]; // First event is featured
  const otherEvents = filteredEvents.slice(1);

  return (
    <main className="min-h-screen bg-[#f8f6f3] dark:bg-[#0a0f1a]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-[#0a0f1a]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
              Upcoming Events
            </span>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1]">
              Events &<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-300">
                Gatherings
              </span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl">
              Join us for worship, fellowship, and spiritual growth. Find an event near you and be part of something greater.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-white dark:bg-[#0d1220] border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {categories.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? "bg-primary text-white"
                      : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <section className="py-20">
          <div className="flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-secondary" />
          </div>
        </section>
      )}

      {/* Featured Event */}
      {!loading && featuredEvent && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link href={`/events/${featuredEvent.slug}`} className="group block">
                <div className="relative rounded-3xl overflow-hidden bg-[#0a0f1a]">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative aspect-[4/3] lg:aspect-auto">
                      {featuredEvent.heroImage ? (
                        <img
                          src={featuredEvent.heroImage.url}
                          alt={featuredEvent.heroImage.alt || featuredEvent.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0f1a] hidden lg:block" />
                    </div>
                    <div className="p-8 lg:p-12 flex flex-col justify-center">
                      <Badge className="w-fit bg-secondary text-[#0a0f1a] mb-4">
                        Featured Event
                      </Badge>
                      <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 group-hover:text-secondary transition-colors">
                        {featuredEvent.title}
                      </h2>
                      <p className="text-white/60 text-lg mb-6">
                        {featuredEvent.subtitle}
                      </p>
                      <div className="flex flex-wrap gap-4 text-white/50 mb-8">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          {formatEventDate(featuredEvent.startDate)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          {formatEventTime(featuredEvent.startDate, featuredEvent.endDate)}
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          {featuredEvent.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-2 text-secondary font-medium group-hover:gap-4 transition-all">
                          {featuredEvent.requiresRegistration ? "Register Now" : "Learn More"}
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Events Grid */}
      {!loading && (
        <section className="py-16 bg-white dark:bg-[#0d1220]">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0a0f1a] dark:text-white">
                All Events
              </h2>
              <span className="text-muted-foreground">
                {filteredEvents.length} events found
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherEvents.map((event, index) => {
                const dateInfo = new Date(event.startDate);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link href={`/events/${event.slug}`} className="group block">
                      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          {event.heroImage ? (
                            <img
                              src={event.heroImage.url}
                              alt={event.heroImage.alt || event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-secondary text-[#0a0f1a]">
                              {getCategoryLabel(event.eventType)}
                            </Badge>
                          </div>
                          <div className="absolute top-4 right-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                              <span className="block text-white text-lg font-bold leading-none">
                                {dateInfo.getDate()}
                              </span>
                              <span className="block text-white/70 text-xs uppercase">
                                {dateInfo.toLocaleString("en-US", { month: "short" })}
                              </span>
                            </div>
                          </div>
                          <div className="absolute bottom-4 right-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:bg-secondary transition-colors duration-300">
                              <ArrowUpRight className="w-4 h-4 text-[#0a0f1a] group-hover:rotate-45 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="font-serif text-xl font-bold text-[#0a0f1a] dark:text-white mb-2 group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-[#0a0f1a]/60 dark:text-white/60 mb-4">{event.subtitle}</p>
                          <div className="flex items-center gap-4 text-sm text-[#0a0f1a]/50 dark:text-white/50">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatEventTime(event.startDate)}
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

            {filteredEvents.length === 0 && (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-2xl font-bold mb-2 text-[#0a0f1a] dark:text-white">No Events Found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filter to find events
                </p>
                <Button onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

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
                Can't Find What You're Looking For?
              </h2>
              <p className="text-white/60 mb-8">
                Contact us to learn about upcoming events or suggest an event for your community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                  <Link href="/contact">
                    Contact Us
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
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
