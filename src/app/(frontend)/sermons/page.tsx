"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Clock, Calendar, Search, Filter, BookOpen } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const sermonCategories = ["All", "Doctrine", "Evangelism", "Holiness", "Prayer", "Faith"];

const sermons = [
  {
    id: 1,
    title: "The Power of Apostolic Faith",
    speaker: "Apostle Arsenio Ferriol",
    date: "Feb 10, 2026",
    duration: "52 min",
    category: "Doctrine",
    image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=600&q=80",
    description: "Understanding the foundation of our apostolic faith and its power to transform lives.",
  },
  {
    id: 2,
    title: "Walking in Holiness",
    speaker: "Apostle Jonathan Ferriol",
    date: "Feb 9, 2026",
    duration: "48 min",
    category: "Holiness",
    image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&q=80",
    description: "A call to live a life set apart for God's purposes.",
  },
  {
    id: 3,
    title: "The Heart of Evangelism",
    speaker: "Bishop Samuel Ferriol",
    date: "Feb 8, 2026",
    duration: "45 min",
    category: "Evangelism",
    image: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=600&q=80",
    description: "Developing a passion for reaching the lost with the Gospel.",
  },
  {
    id: 4,
    title: "Effective Prayer Life",
    speaker: "Archbishop Arturo Ferriol",
    date: "Feb 7, 2026",
    duration: "55 min",
    category: "Prayer",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80",
    description: "Building a consistent and powerful prayer life.",
  },
  {
    id: 5,
    title: "Faith That Overcomes",
    speaker: "Bishop Aldrin Palanca",
    date: "Feb 6, 2026",
    duration: "42 min",
    category: "Faith",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80",
    description: "How faith enables us to overcome every obstacle.",
  },
  {
    id: 6,
    title: "The Doctrine of Salvation",
    speaker: "Apostle Arsenio Ferriol",
    date: "Feb 5, 2026",
    duration: "58 min",
    category: "Doctrine",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    description: "Understanding God's plan of salvation through Jesus Christ.",
  },
];

export default function SermonsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSermons = sermons.filter(sermon => {
    const matchesCategory = activeCategory === "All" || sermon.category === activeCategory;
    const matchesSearch = sermon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sermon.speaker.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#0a0f1a]">
      <Header />

      {/* Hero */}
      <section className="relative pt-20">
        <div className="relative h-[300px] md:h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2035] via-[#0a0f1a] to-[#0d1220]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-6"
            >
              <BookOpen className="w-10 h-10 text-secondary" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center"
            >
              Sermons
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/60 mt-4 text-center max-w-xl"
            >
              Biblical teachings rooted in apostolic doctrine
            </motion.p>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search sermons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-secondary/50"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {sermonCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
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
        </div>
      </section>

      {/* Sermons Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSermons.map((sermon, index) => (
              <motion.div
                key={sermon.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-secondary/30 transition-colors"
              >
                <div className="relative aspect-video">
                  <Image
                    src={sermon.image}
                    alt={sermon.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                      <Play className="w-6 h-6 text-[#0a0f1a] ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-secondary text-[#0a0f1a] text-xs font-bold uppercase rounded-full">
                      {sermon.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl font-bold text-white mb-2 group-hover:text-secondary transition-colors">
                    {sermon.title}
                  </h3>
                  <p className="text-white/50 text-sm mb-4">{sermon.speaker}</p>
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">{sermon.description}</p>
                  <div className="flex items-center gap-4 text-sm text-white/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {sermon.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {sermon.duration}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredSermons.length === 0 && (
            <div className="text-center py-16">
              <p className="text-white/50">No sermons found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
