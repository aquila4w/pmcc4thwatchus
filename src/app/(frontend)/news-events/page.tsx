"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Search,
  ArrowUpRight,
  Loader2,
  Newspaper,
  Filter,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface NewsEvent {
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
  heroImage: {
    url: string;
    alt: string;
  } | null;
  featuredImage?: {
    url: string;
    alt: string;
  } | null;
  gallery: Array<{
    image: { url: string; alt: string };
    caption: string;
  }>;
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
  isPublished: boolean;
  isFeatured: boolean;
  requiresRegistration?: boolean;
  registrationUrl?: string;
  organizer?: { id: string; name: string } | null;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

// Categories for filtering
const categories = ["All", "General", "Conference", "Training", "Worship", "Crusade", "Youth", "Announcement"];

// Helper functions
function formatEventDate(dateString: string | undefined) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatNewsDate(dateString: string | undefined) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventTime(dateString: string | undefined, endDateString?: string) {
  if (!dateString) return "";
  const startDate = new Date(dateString);
  const startTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (endDateString) {
    const endDate = new Date(endDateString);
    if (startDate.toDateString() !== endDate.toDateString()) {
      return "Multi-day event";
    }
    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${startTime} - ${endTime}`;
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

export default function NewsEventsPage() {
  const [items, setItems] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [typeFilter, setTypeFilter] = useState<"all" | "news" | "event">("all");

  // Fetch news-events from API
  useEffect(() => {
    async function fetchItems() {
      try {
        const params = new URLSearchParams({
          published: "true",
        });
        if (selectedCategory !== "All") {
          params.append("category", selectedCategory.toLowerCase());
        }
        if (searchQuery) {
          params.append("search", searchQuery);
        }
        if (typeFilter !== "all") {
          params.append("type", typeFilter);
        }

        const response = await fetch(`/api/news-events?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          setItems(data.items);
        }
      } catch (error) {
        console.error("Error fetching news-events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [selectedCategory, searchQuery, typeFilter]);

  // Separate news and events
  const newsItems = items.filter((item) => item.type === "news");
  const eventItems = items.filter((item) => item.type === "event");

  const featuredItem = items.find((item) => item.isFeatured) || items[0];

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
              News & Events
            </span>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1]">
              Stay Connected &<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-300">
                Informed
              </span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl">
              Catch up on the latest news from our community and discover upcoming events where you can connect, worship, and grow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-white dark:bg-[#0d1220] border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Type Filter & Category */}
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  typeFilter === "all"
                    ? "bg-primary text-white"
                    : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("news")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  typeFilter === "news"
                    ? "bg-primary text-white"
                    : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20"
                }`}
              >
                <Newspaper className="w-3 h-3 inline mr-1" />
                News
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("event")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  typeFilter === "event"
                    ? "bg-primary text-white"
                    : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20"
                }`}
              >
                <Calendar className="w-3 h-3 inline mr-1" />
                Events
              </button>
            </div>

            {typeFilter !== "news" && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? "bg-secondary text-[#0a0f1a]"
                        : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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

      {/* Featured Item */}
      {!loading && featuredItem && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link href={`/news-events/${featuredItem.slug}`} className="group block">
                <div className="relative rounded-3xl overflow-hidden bg-[#0a0f1a]">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative aspect-[4/3] lg:aspect-auto">
                      {featuredItem.heroImage ? (
                        <img
                          src={featuredItem.heroImage.url}
                          alt={featuredItem.heroImage.alt || featuredItem.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0f1a] hidden lg:block" />
                    </div>
                    <div className="p-8 lg:p-12 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className={featuredItem.type === "news" ? "bg-blue-500 text-white" : "bg-secondary text-[#0a0f1a]"}>
                          {featuredItem.type === "news" ? "News" : "Event"}
                        </Badge>
                        <Badge variant="outline" className="border-white/20 text-white/70">
                          Featured
                        </Badge>
                      </div>
                      <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 group-hover:text-secondary transition-colors">
                        {featuredItem.title}
                      </h2>
                      <p className="text-white/60 text-lg mb-6">
                        {featuredItem.subtitle}
                      </p>
                      {featuredItem.type === "event" && (
                        <div className="flex flex-wrap gap-4 text-white/50 mb-8">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            {formatEventDate(featuredItem.startDate)}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            {formatEventTime(featuredItem.startDate, featuredItem.endDate)}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            {featuredItem.location}
                          </span>
                        </div>
                      )}
                      {featuredItem.type === "news" && featuredItem.newsDate && (
                        <div className="flex flex-wrap gap-4 text-white/50 mb-8">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            {formatNewsDate(featuredItem.newsDate)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-2 text-secondary font-medium group-hover:gap-4 transition-all">
                          {featuredItem.type === "event" && featuredItem.requiresRegistration ? "Register Now" : "Read More"}
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

      {/* Events Section */}
      {!loading && typeFilter !== "news" && eventItems.length > 0 && (
        <section className="py-16 bg-white dark:bg-[#0d1220]">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0a0f1a] dark:text-white">
                Upcoming Events
              </h2>
              <span className="text-muted-foreground">
                {eventItems.length} events
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {eventItems.map((item, index) => {
                const dateInfo = item.startDate ? new Date(item.startDate) : null;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link href={`/news-events/${item.slug}`} className="group block">
                      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          {item.heroImage ? (
                            <img
                              src={item.heroImage.url}
                              alt={item.heroImage.alt || item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-secondary text-[#0a0f1a]">
                              {getCategoryLabel(item.eventType)}
                            </Badge>
                          </div>
                          {dateInfo && (
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
                          )}
                          <div className="absolute bottom-4 right-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:bg-secondary transition-colors duration-300">
                              <ArrowUpRight className="w-4 h-4 text-[#0a0f1a] group-hover:rotate-45 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="font-serif text-xl font-bold text-[#0a0f1a] dark:text-white mb-2 group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-[#0a0f1a]/60 dark:text-white/60 mb-4">{item.subtitle}</p>
                          <div className="flex items-center gap-4 text-sm text-[#0a0f1a]/50 dark:text-white/50">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatEventTime(item.startDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {item.location}
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
        </section>
      )}

      {/* News Section */}
      {!loading && typeFilter !== "event" && newsItems.length > 0 && (
        <section className="py-16 bg-slate-50 dark:bg-[#0d1220]">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0a0f1a] dark:text-white">
                Latest News
              </h2>
              <span className="text-muted-foreground">
                {newsItems.length} articles
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newsItems.map((item, index) => {
                const dateInfo = item.newsDate ? new Date(item.newsDate) : null;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link href={`/news-events/${item.slug}`} className="group block">
                      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          {item.heroImage ? (
                            <img
                              src={item.heroImage.url}
                              alt={item.heroImage.alt || item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-blue-600/20" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-blue-500 text-white">
                              News
                            </Badge>
                          </div>
                          {dateInfo && (
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
                          )}
                          <div className="absolute bottom-4 right-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-300">
                              <ArrowUpRight className="w-4 h-4 text-[#0a0f1a] group-hover:rotate-45 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="font-serif text-xl font-bold text-[#0a0f1a] dark:text-white mb-2 group-hover:text-blue-500 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-[#0a0f1a]/60 dark:text-white/60 mb-4 line-clamp-2">{item.description}</p>
                          <div className="flex items-center gap-2 text-sm text-[#0a0f1a]/50 dark:text-white/50">
                            <Calendar className="w-4 h-4" />
                            {formatNewsDate(item.newsDate)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <section className="py-20 bg-white dark:bg-[#0d1220]">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <Newspaper className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-serif text-2xl font-bold mb-2 text-[#0a0f1a] dark:text-white">No Items Found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Button onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setTypeFilter("all"); }}>
                Clear Filters
              </Button>
            </div>
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
                Stay Connected
              </h2>
              <p className="text-white/60 mb-8">
                Find a church near you and be part of our community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                  <Link href="/locate">
                    Find a Church
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Link href="/contact">
                    Contact Us
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
