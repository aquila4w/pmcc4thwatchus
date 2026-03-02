"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const galleryCategories = ["All", "Crusades", "Worship", "Baptism", "Fellowship"];

const galleryItems = [
  {
    id: 1,
    type: "image",
    category: "Crusades",
    src: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80",
    title: "HFGC 2025 - Night of Praise",
  },
  {
    id: 2,
    type: "image",
    category: "Worship",
    src: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80",
    title: "Sunday Worship Service",
  },
  {
    id: 3,
    type: "image",
    category: "Baptism",
    src: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80",
    title: "Water Baptism Ceremony",
  },
  {
    id: 4,
    type: "image",
    category: "Fellowship",
    src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
    title: "Youth Fellowship",
  },
  {
    id: 5,
    type: "image",
    category: "Crusades",
    src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    title: "Evangelistic Night",
  },
  {
    id: 6,
    type: "image",
    category: "Worship",
    src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    title: "Praise and Worship",
  },
  {
    id: 7,
    type: "image",
    category: "Fellowship",
    src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    title: "Community Outreach",
  },
  {
    id: 8,
    type: "image",
    category: "Crusades",
    src: "https://images.unsplash.com/photo-1493225255756-d9584f8906d4?w=800&q=80",
    title: "Prayer Rally",
  },
];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<typeof galleryItems[0] | null>(null);

  const filteredItems = activeCategory === "All"
    ? galleryItems
    : galleryItems.filter(item => item.category === activeCategory);

  const currentIndex = selectedImage ? filteredItems.findIndex(item => item.id === selectedImage.id) : -1;

  const navigateImage = (direction: "prev" | "next") => {
    if (!selectedImage) return;
    const newIndex = direction === "prev"
      ? (currentIndex - 1 + filteredItems.length) % filteredItems.length
      : (currentIndex + 1) % filteredItems.length;
    setSelectedImage(filteredItems[newIndex]);
  };

  return (
    <main className="min-h-screen bg-[#0a0f1a]">
      <Header />

      {/* Hero */}
      <section className="relative pt-20">
        <div className="relative h-[300px] md:h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2035] via-[#0a0f1a] to-[#0d1220]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-secondary text-sm uppercase tracking-[0.3em] mb-4"
            >
              Capturing Moments
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center"
            >
              Crusade Gallery
            </motion.h1>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {galleryCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? "bg-secondary text-[#0a0f1a]"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage(item)}
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-center p-4">
                    <span className="text-secondary text-xs uppercase tracking-wider">{item.category}</span>
                    <h3 className="text-white font-semibold mt-1">{item.title}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); navigateImage("prev"); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); navigateImage("next"); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl max-h-[80vh] w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage.src}
                alt={selectedImage.title}
                width={1200}
                height={800}
                className="object-contain w-full h-full rounded-lg"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                <span className="text-secondary text-xs uppercase tracking-wider">{selectedImage.category}</span>
                <h3 className="text-white text-xl font-semibold mt-1">{selectedImage.title}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-4">
            Experience It Live
          </h2>
          <p className="text-white/60 mb-8">
            Join us at our next crusade and be part of these powerful moments.
          </p>
          <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
            <Link href="/events">View Upcoming Events</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
