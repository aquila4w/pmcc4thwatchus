"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Radio, Play, Pause, Volume2, Clock, Calendar, Mic, Headphones } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const radioShows = [
  {
    title: "Morning Devotion",
    time: "6:00 AM - 7:00 AM",
    days: "Mon - Fri",
    description: "Start your day with prayer and the Word of God.",
    host: "Various Ministers",
  },
  {
    title: "The Surer Word",
    time: "8:00 PM - 9:00 PM",
    days: "Daily",
    description: "Deep biblical teachings and apostolic doctrine.",
    host: "Apostle Arsenio Ferriol",
  },
  {
    title: "Youth Hour",
    time: "7:00 PM - 8:00 PM",
    days: "Saturdays",
    description: "Inspiring messages and music for the youth.",
    host: "Youth Ministry Team",
  },
  {
    title: "Hymns of Faith",
    time: "5:00 PM - 6:00 PM",
    days: "Sundays",
    description: "Traditional hymns and spiritual songs.",
    host: "Church Choir",
  },
];

const recentEpisodes = [
  {
    title: "The Power of Prayer",
    date: "Feb 14, 2026",
    duration: "45 min",
    image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&q=80",
  },
  {
    title: "Walking in Holiness",
    date: "Feb 13, 2026",
    duration: "52 min",
    image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&q=80",
  },
  {
    title: "Faith That Moves Mountains",
    date: "Feb 12, 2026",
    duration: "48 min",
    image: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=400&q=80",
  },
];

export default function RadioPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <main className="min-h-screen bg-[#0a0f1a]">
      <Header />

      {/* Hero */}
      <section className="relative pt-20">
        <div className="relative min-h-[500px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-[#0a0f1a] to-secondary/10" />

          {/* Animated sound waves background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="flex items-end gap-1 h-40">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-secondary rounded-full"
                  animate={{
                    height: [20, Math.random() * 150 + 20, 20],
                  }}
                  transition={{
                    duration: 1 + Math.random(),
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="relative container mx-auto px-4 py-20 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="w-32 h-32 rounded-full bg-secondary/20 flex items-center justify-center mb-8"
            >
              <Radio className="w-16 h-16 text-secondary" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4"
            >
              Home Free Radio
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/60 text-lg md:text-xl max-w-2xl mb-8"
            >
              24/7 Gospel broadcasting bringing the Word of God to homes around the world.
            </motion.p>

            {/* Live Player */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 max-w-md w-full"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-sm font-medium">LIVE NOW</span>
              </div>

              <h3 className="text-white font-semibold text-lg mb-1">The Surer Word</h3>
              <p className="text-white/50 text-sm mb-6">with Apostle Arsenio Ferriol</p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/90 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-[#0a0f1a]" />
                  ) : (
                    <Play className="w-6 h-6 text-[#0a0f1a] ml-1" />
                  )}
                </button>
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-secondary"
                    animate={{ width: isPlaying ? "100%" : "0%" }}
                    transition={{ duration: 30, ease: "linear", repeat: Infinity }}
                  />
                </div>
                <Volume2 className="w-5 h-5 text-white/50" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="py-20 bg-[#0d1220]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-secondary text-sm uppercase tracking-[0.3em] mb-4 block">
              Programming
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
              Show Schedule
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {radioShows.map((show, index) => (
              <motion.div
                key={show.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-white mb-1">{show.title}</h3>
                    <p className="text-white/50 text-sm flex items-center gap-2">
                      <Mic className="w-4 h-4" /> {show.host}
                    </p>
                  </div>
                  <Headphones className="w-6 h-6 text-secondary" />
                </div>
                <p className="text-white/60 mb-4">{show.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-secondary">
                    <Clock className="w-4 h-4" /> {show.time}
                  </span>
                  <span className="flex items-center gap-1 text-white/40">
                    <Calendar className="w-4 h-4" /> {show.days}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Episodes */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-secondary text-sm uppercase tracking-[0.3em] mb-4 block">
              On Demand
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
              Recent Episodes
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentEpisodes.map((episode, index) => (
              <motion.div
                key={episode.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                  <Image
                    src={episode.image}
                    alt={episode.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                      <Play className="w-6 h-6 text-[#0a0f1a] ml-1" />
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-white group-hover:text-secondary transition-colors">
                  {episode.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-white/50 mt-2">
                  <span>{episode.date}</span>
                  <span>{episode.duration}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Link href="/sermons">View All Episodes</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
