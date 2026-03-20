"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ArrowRight,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Users,
  Home,
  HandHeart,
  Sparkles,
  Church,
  Globe2,
  Gift
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

// Milestone data - 33 items (mix of images and videos)
const milestones = Array.from({ length: 33 }, (_, i) => {
  const num = i + 1;
  const isVideo = [1, 6, 10, 14, 20, 26, 29, 30, 33].includes(num);
  return {
    id: num,
    type: isVideo ? ("video" as const) : ("image" as const),
    url: `https://images.pmcc4thwatch.us/HFGC/2026/01%20-%20Manila/milestone/${num}.${isVideo ? "mp4" : "jpg"}`,
  };
});

// Favor/blessings gallery - 29 images
const favorImages = Array.from({ length: 29 }, (_, i) => ({
  id: i + 1,
  type: "image" as const,
  url: `https://images.pmcc4thwatch.us/HFGC/2026/01%20-%20Manila/favor/${i + 1}.png`,
}));

// Testimonies data - 33 testimonies
const testimonies = Array.from({ length: 33 }, (_, i) => {
  const num = i + 1;
  const isVideo = [2, 4, 6, 9, 10, 28, 29].includes(num);
  const hasMultipleImages = num === 27;
  return {
    id: num,
    type: isVideo ? ("video" as const) : ("image" as const),
    url: hasMultipleImages
      ? [
          `https://images.pmcc4thwatch.us/HFGC/2026/01%20-%20Manila/testimonies/27/27.1.jpg`,
          `https://images.pmcc4thwatch.us/HFGC/2026/01%20-%20Manila/testimonies/27/27.2.jpg`,
        ]
      : `https://images.pmcc4thwatch.us/HFGC/2026/01%20-%20Manila/testimonies/${num}/${num}.${isVideo ? "mp4" : "jpg"}`,
  };
});

// Impact stats
const impactStats = [
  { icon: Users, value: "10,000+", label: "Lives Touched" },
  { icon: Church, value: "33", label: "Milestone Victories" },
  { icon: Home, value: "100+", label: "Families Blessed" },
  { icon: Gift, value: "29", label: "Divine Favors" },
];

export default function GivePage() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [currentSection, setCurrentSection] = useState<"favor" | "milestone" | "testimonies">("favor");
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto-advance gallery
  useEffect(() => {
    if (!lightboxOpen && autoPlay) {
      const interval = setInterval(() => {
        setLightboxIndex((prev) => {
          const items = currentSection === "favor" ? favorImages : currentSection === "milestone" ? milestones : testimonies;
          return (prev + 1) % items.length;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [lightboxOpen, autoPlay, currentSection]);

  const openLightbox = (index: number, section: typeof currentSection) => {
    setCurrentSection(section);
    setLightboxIndex(index);
    setLightboxOpen(true);
    setAutoPlay(false);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setAutoPlay(true);
  };

  const getCurrentItems = () => {
    switch (currentSection) {
      case "favor": return favorImages;
      case "milestone": return milestones;
      case "testimonies": return testimonies;
    }
  };

  const currentItem = getCurrentItems()[lightboxIndex];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      {/* Hero Section - Emotional & Compelling */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('https://images.pmcc4thwatch.us/HFGC/2026/01%20-%20Manila/milestone/1.mp4')] bg-cover bg-center opacity-20" />
        </div>

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-amber-400/30 rounded-full"
              animate={{
                y: [0, -1000],
                x: [0, Math.random() * 200 - 100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 10,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                bottom: 0,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-4 py-2 mb-6"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 text-sm font-semibold">New York 2026 Fund Drive</span>
              </motion.div>

              <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Will You Help
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300">
                  Bring Them Home?
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed"
              >
                Every soul deserves to experience the <span className="text-amber-300 font-semibold">transformative power</span> of God's love.
                Join us in the <span className="text-amber-300 font-semibold">Home Free Global Crusade</span> —
                where <span className="text-amber-300 font-semibold">miracles happen</span> and
                <span className="text-amber-300 font-semibold"> lives are forever changed</span>.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4 mb-8"
              >
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  <span>Manila, Philippines — January 2026</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>A Divine Appointment Awaits</span>
                </div>
              </motion.div>

              {/* Impact Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
              >
                {impactStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10"
                  >
                    <stat.icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/60">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex flex-wrap gap-4"
              >
                <a
                  href="#donate"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-slate-900 font-bold px-8 py-4 rounded-full transition-all transform hover:scale-105 shadow-lg shadow-amber-500/30"
                >
                  <Heart className="w-5 h-5" />
                  Donate Now
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="#gallery"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-full transition-all border border-white/20"
                >
                  <Play className="w-5 h-5" />
                  See the Impact
                </a>
              </motion.div>
            </motion.div>

            {/* Right - Zeffy Donation Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              id="donate"
              className="sticky top-24"
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-400 p-4 text-center">
                  <h2 className="text-2xl font-bold text-slate-900">Home Free Fund Drive</h2>
                  <p className="text-slate-800">Your Gift Changes Lives Forever</p>
                </div>
                <div style={{ position: "relative", overflow: "hidden", height: "450px", width: "100%" }}>
                  <iframe
                    title="Donation form powered by Zeffy"
                    style={{ position: "absolute", border: 0, top: 0, left: 0, bottom: 0, right: 0, width: "100%", height: "100%" }}
                    src="https://www.zeffy.com/embed/donation-form/home-free-fund-drive-new-york--2026"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Calendar className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Divine Schedule
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Join us for these Spirit-filled events
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <img
              src="https://images.pmcc4thwatch.us/HFGC/2026/schedule/schedule.png"
              alt="Event Schedule"
              className="w-full h-auto rounded-2xl shadow-xl"
            />
          </motion.div>
        </div>
      </section>

      {/* Gallery Section with Tabs */}
      <section id="gallery" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Witness the Miracles
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              See how God is moving through the Home Free Global Crusade
            </p>
          </motion.div>

          {/* Gallery Tabs */}
          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            {[
              { key: "favor" as const, label: "Divine Favors", icon: HandHeart },
              { key: "milestone" as const, label: "Milestones", icon: Sparkles },
              { key: "testimonies" as const, label: "Testimonies", icon: Users },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setCurrentSection(tab.key); setLightboxIndex(0); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                  currentSection === tab.key
                    ? "bg-amber-500 text-slate-900 shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-w-6xl mx-auto">
            {getCurrentItems().slice(0, 30).map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.02 }}
                onClick={() => openLightbox(index, currentSection)}
                className="relative aspect-square rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:scale-105 group"
              >
                {"url" in item && Array.isArray(item.url) ? (
                  <>
                    <img
                      src={item.url[0]}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">+1</span>
                    </div>
                  </>
                ) : item.type === "video" ? (
                  <div className="relative w-full h-full bg-slate-800">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white/80" />
                    </div>
                    <video
                      src={item.url as string}
                      className="w-full h-full object-cover opacity-80"
                      muted
                    />
                  </div>
                ) : (
                  <img
                    src={item.url as string}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Overall Report Section */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Globe2 className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
              The Harvest Report
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              God's faithfulness displayed in numbers
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <img
              src="https://images.pmcc4thwatch.us/HFGC/2026/01%20-%20Manila/report/overall/overall.jpg"
              alt="Overall Report"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-500 to-orange-400">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Heart className="w-16 h-16 text-slate-900 mx-auto mb-6" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Be Part of Something Eternal
            </h2>
            <p className="text-slate-800 text-lg mb-8 max-w-2xl mx-auto">
              Your donation helps bring the Gospel to those who have never heard.
              Every gift, no matter the size, makes an eternal difference.
            </p>
            <a
              href="#donate"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-4 rounded-full transition-all transform hover:scale-105"
            >
              <Gift className="w-5 h-5" />
              Give Your Gift Today
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && currentItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-amber-400 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev > 0 ? prev - 1 : getCurrentItems().length - 1));
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-amber-400 transition-colors"
            >
              <ChevronLeft className="w-12 h-12" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev + 1) % getCurrentItems().length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-amber-400 transition-colors"
            >
              <ChevronRight className="w-12 h-12" />
            </button>

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl max-h-[80vh] relative"
            >
              {"url" in currentItem && Array.isArray(currentItem.url) ? (
                <div className="flex gap-4">
                  {currentItem.url.map((url, i) => (
                    <img key={i} src={url} alt="Gallery" className="max-h-[80vh] rounded-lg" />
                  ))}
                </div>
              ) : currentItem.type === "video" ? (
                <video
                  src={currentItem.url as string}
                  controls
                  autoPlay
                  className="max-h-[80vh] rounded-lg"
                />
              ) : (
                <img
                  src={currentItem.url as string}
                  alt="Gallery"
                  className="max-h-[80vh] rounded-lg"
                />
              )}
            </motion.div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {lightboxIndex + 1} / {getCurrentItems().length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
