"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  Search,
  ChevronDown,
  ChevronRight,
  Navigation,
  Mail,
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Church {
  localeName: string;
  name: string;
  pastor: string;
  subDistrict: string;
  address: string;
  phone: string;
  email: string;
  lat: number;
  lng: number;
  slug: string;
}

// Church locations fetched from internal API (proxies Google Sheets server-side)

export default function LocateChurchesPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedChurch, setExpandedChurch] = useState<string | null>(null);
  const [expandedDistricts, setExpandedDistricts] = useState<string[]>([]);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);

  // Fetch churches from internal API
  const fetchChurches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/locations");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch data");
      }

      const places: Church[] = data.churches || [];

      setChurches(places);

      if (places.length > 0) {
        const firstDistrict = places[0]?.subDistrict;
        if (firstDistrict) {
          setExpandedDistricts([firstDistrict]);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load church data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChurches();
  }, [fetchChurches]);

  // Filter churches based on search
  const filteredChurches = useMemo(() => {
    if (!searchQuery.trim()) return churches;

    const query = searchQuery.toLowerCase();
    return churches.filter(
      church =>
        church.localeName.toLowerCase().includes(query) ||
        church.name.toLowerCase().includes(query) ||
        church.address.toLowerCase().includes(query) ||
        church.subDistrict.toLowerCase().includes(query) ||
        church.email.toLowerCase().includes(query) ||
        church.pastor.toLowerCase().includes(query)
    );
  }, [churches, searchQuery]);

  // Group churches by sub-district (preserving original order)
  const { churchesByDistrict, districtOrder } = useMemo(() => {
    const grouped: { [key: string]: Church[] } = {};
    const order: string[] = [];

    filteredChurches.forEach(church => {
      const district = church.subDistrict || "Other";
      if (!grouped[district]) {
        grouped[district] = [];
        order.push(district);
      }
      grouped[district].push(church);
    });

    return { churchesByDistrict: grouped, districtOrder: order };
  }, [filteredChurches]);

  const toggleDistrict = (district: string) => {
    setExpandedDistricts(prev =>
      prev.includes(district)
        ? prev.filter(d => d !== district)
        : [...prev, district]
    );
  };

  const handleChurchClick = (church: Church) => {
    const churchKey = `${church.name}-${church.address}`;
    const isExpanding = expandedChurch !== churchKey;
    setExpandedChurch(isExpanding ? churchKey : null);

    if (isExpanding) {
      setSelectedChurch(church);
    }
  };

  const expandAllDistricts = () => {
    setExpandedDistricts(districtOrder);
  };

  const collapseAllDistricts = () => {
    setExpandedDistricts([]);
    setExpandedChurch(null);
  };

  // Generate Google Maps Embed URL (no API key required)
  const getMapEmbedUrl = () => {
    if (selectedChurch) {
      // Use coordinates for precise location, or address as fallback
      const query = selectedChurch.lat && selectedChurch.lng
        ? `${selectedChurch.lat},${selectedChurch.lng}`
        : encodeURIComponent(selectedChurch.address);
      return `https://maps.google.com/maps?q=${query}&output=embed`;
    }
    // Default: US centered view
    return "https://maps.google.com/maps?q=United+States&t=&z=4&ie=UTF8&iwloc=&output=embed";
  };

  return (
    <main className="min-h-screen bg-[#f8f6f3] dark:bg-[#0a0f1a]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-8 bg-gradient-to-b from-[#5a7a8a] to-[#4a6a7a]">
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Locate a Church
            </h1>
            <p className="text-white/80 text-lg leading-relaxed mb-8">
              Find a PMCC 4th Watch church near you. We welcome you with open doors across the U.S.
              Whoever and wherever you are, come just as you are!
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by church name, city, or sub-district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-6 bg-white border-0 text-slate-800 placeholder:text-slate-400 text-lg rounded-xl shadow-lg"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Church List by Sub-District */}
            <div className="space-y-4">
              {/* Header with controls */}
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                  Churches by Sub-District
                </h2>
                {!loading && districtOrder.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={expandAllDistricts}
                      className="text-sm text-primary hover:underline"
                    >
                      Expand All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={collapseAllDistricts}
                      className="text-sm text-primary hover:underline"
                    >
                      Collapse All
                    </button>
                  </div>
                )}
              </div>

              {/* Stats */}
              {!loading && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{filteredChurches.length} churches</span>
                  <span>•</span>
                  <span>{districtOrder.length} sub-districts</span>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <Card className="p-8 text-center">
                  <Loader2 className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Loading churches...</p>
                </Card>
              )}

              {/* Error State */}
              {error && (
                <Card className="p-8 text-center">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">Failed to Load</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={fetchChurches} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </Card>
              )}

              {/* No Results */}
              {!loading && !error && filteredChurches.length === 0 && (
                <Card className="p-8 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No churches found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria
                  </p>
                  <Button onClick={() => setSearchQuery("")} variant="outline">
                    Clear Search
                  </Button>
                </Card>
              )}

              {/* Sub-District Groups */}
              {!loading && !error && (
                <div className="space-y-3 max-h-[650px] overflow-y-auto pr-2">
                  {districtOrder.map((district) => (
                    <Card key={district} className="overflow-hidden">
                      {/* Sub-District Header */}
                      <button
                        type="button"
                        onClick={() => toggleDistrict(district)}
                        className="w-full p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {district}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {churchesByDistrict[district].length} {churchesByDistrict[district].length === 1 ? 'church' : 'churches'}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                            expandedDistricts.includes(district) ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Church List within Sub-District */}
                      <AnimatePresence>
                        {expandedDistricts.includes(district) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-slate-100 dark:border-slate-700">
                              {churchesByDistrict[district].map((church) => {
                                const churchKey = `${church.name}-${church.address}`;
                                const isExpanded = expandedChurch === churchKey;

                                return (
                                  <div
                                    key={churchKey}
                                    className={`border-b border-slate-50 dark:border-slate-800 last:border-b-0 ${
                                      isExpanded ? "bg-primary/5" : ""
                                    }`}
                                  >
                                    {/* Church Name Row */}
                                    <button
                                      type="button"
                                      onClick={() => handleChurchClick(church)}
                                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <MapPin className={`w-4 h-4 flex-shrink-0 ${isExpanded ? 'text-primary' : 'text-slate-400'}`} />
                                        <span className={`text-sm ${isExpanded ? 'font-medium text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                          {church.localeName}
                                        </span>
                                      </div>
                                      <ChevronRight
                                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                          isExpanded ? "rotate-90" : ""
                                        }`}
                                      />
                                    </button>

                                    {/* Inline Church Details */}
                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.15 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="px-4 pb-4 pl-11 space-y-3">
                                            {/* Full Church Name */}
                                            {church.name && church.name !== church.localeName && (
                                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                {church.name}
                                              </p>
                                            )}

                                            {/* Pastor */}
                                            {church.pastor && (
                                              <div className="flex items-start gap-2">
                                                <span className="text-sm text-slate-500 dark:text-slate-500 font-medium whitespace-nowrap">
                                                  Pastor:
                                                </span>
                                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                                  {church.pastor}
                                                </span>
                                              </div>
                                            )}

                                            {/* Address */}
                                            <div className="flex items-start gap-2">
                                              <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {church.address}
                                              </p>
                                            </div>

                                            {/* Phone */}
                                            {church.phone && (
                                              <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                                                <a
                                                  href={`tel:${church.phone}`}
                                                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                                                >
                                                  {church.phone}
                                                </a>
                                              </div>
                                            )}

                                            {/* Email */}
                                            {church.email && (
                                              <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                                                <a
                                                  href={`mailto:${church.email}`}
                                                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors truncate"
                                                >
                                                  {church.email}
                                                </a>
                                              </div>
                                            )}

                                            {/* Church Website */}
                                            {church.slug && (
                                              <div className="flex items-center gap-2">
                                                <ExternalLink className="w-4 h-4 text-primary flex-shrink-0" />
                                                <a
                                                  href={`https://${church.slug}.pmcc4thwatch.us`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                                                >
                                                  Visit Website
                                                </a>
                                              </div>
                                            )}

                                            {/* Get Directions Button */}
                                            <Button
                                              size="sm"
                                              className="w-full mt-2 bg-primary hover:bg-primary/90"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(
                                                  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(church.address)}`,
                                                  "_blank"
                                                );
                                              }}
                                            >
                                              <Navigation className="w-4 h-4 mr-2" />
                                              Get Directions
                                            </Button>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Map Embed */}
            <div className="lg:sticky lg:top-24 h-fit">
              <Card className="overflow-hidden">
                <iframe
                  src={getMapEmbedUrl()}
                  width="100%"
                  height="500"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Church Location Map"
                  className="lg:h-[600px]"
                />
              </Card>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {selectedChurch ? (
                  <span className="flex items-center justify-center gap-2">
                    Showing: <strong>{selectedChurch.localeName}</strong>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(selectedChurch.localeName + " " + selectedChurch.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Open in Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                ) : (
                  "Click on a church to view its location"
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* International Section */}
      <section className="py-12 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white mb-4">
              Looking for international locations?
            </h3>
            <p className="text-muted-foreground mb-2">
              For locations in Canada, please visit the{" "}
              <a
                href="https://pmcc4w.ca/locations/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline"
              >
                Canada Website
              </a>
            </p>
            <p className="text-muted-foreground">
              For other international locations, please visit our{" "}
              <a
                href="https://pmcc4thwatch.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline"
              >
                Main Website
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
