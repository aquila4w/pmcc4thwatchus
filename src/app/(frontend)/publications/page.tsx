"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { BookOpen, Download, ExternalLink, FileText, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const publications = [
  {
    id: 1,
    title: "The Surer Word Magazine",
    type: "Magazine",
    description: "Our quarterly magazine featuring articles on faith, doctrine, and church updates.",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80",
    date: "Q1 2026",
    downloadable: true,
  },
  {
    id: 2,
    title: "Apostolic Doctrines",
    type: "Book",
    description: "A comprehensive guide to the foundational doctrines of our apostolic faith.",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80",
    date: "2025",
    downloadable: false,
  },
  {
    id: 3,
    title: "Daily Devotional Guide",
    type: "Devotional",
    description: "365 days of Scripture readings, reflections, and prayers.",
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80",
    date: "2026",
    downloadable: true,
  },
  {
    id: 4,
    title: "Church History",
    type: "Book",
    description: "The story of PMCC 4th Watch from its founding to the present day.",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80",
    date: "2024",
    downloadable: false,
  },
  {
    id: 5,
    title: "Hymnal Collection",
    type: "Songbook",
    description: "Traditional and contemporary hymns for worship and devotion.",
    image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&q=80",
    date: "2023",
    downloadable: true,
  },
  {
    id: 6,
    title: "Youth Bible Study Guide",
    type: "Study Guide",
    description: "Interactive Bible study materials designed for young believers.",
    image: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=600&q=80",
    date: "2025",
    downloadable: true,
  },
];

const featuredPublication = publications[0];

export default function PublicationsPage() {
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
              <FileText className="w-10 h-10 text-secondary" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center"
            >
              Publications
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/60 mt-4 text-center max-w-xl"
            >
              Resources for spiritual growth and biblical understanding
            </motion.p>
          </div>
        </div>
      </section>

      {/* Featured Publication */}
      <section className="py-16 bg-[#0d1220]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="relative aspect-[3/4] max-w-md mx-auto lg:mx-0 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={featuredPublication.image}
                alt={featuredPublication.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-secondary text-[#0a0f1a] text-xs font-bold uppercase rounded-full">
                  Featured
                </span>
              </div>
            </div>
            <div>
              <span className="text-secondary text-sm uppercase tracking-[0.2em]">
                {featuredPublication.type}
              </span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mt-2 mb-4">
                {featuredPublication.title}
              </h2>
              <p className="text-white/60 text-lg mb-6">
                {featuredPublication.description}
              </p>
              <div className="flex items-center gap-4 text-white/50 mb-8">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> {featuredPublication.date}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                  <Download className="w-5 h-5 mr-2" /> Download PDF
                </Button>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ExternalLink className="w-5 h-5 mr-2" /> Read Online
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* All Publications */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-secondary text-sm uppercase tracking-[0.3em] mb-4 block">
              Library
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
              All Publications
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {publications.slice(1).map((pub, index) => (
              <motion.div
                key={pub.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-secondary/30 transition-colors"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={pub.image}
                    alt={pub.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-xs font-medium rounded-full">
                      {pub.type}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl font-bold text-white mb-2 group-hover:text-secondary transition-colors">
                    {pub.title}
                  </h3>
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">{pub.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-sm flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {pub.date}
                    </span>
                    {pub.downloadable && (
                      <Button size="sm" variant="ghost" className="text-secondary hover:text-secondary/80 hover:bg-secondary/10">
                        <Download className="w-4 h-4 mr-1" /> Download
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-secondary/10 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-4">
            Request Physical Copies
          </h2>
          <p className="text-white/60 max-w-xl mx-auto mb-8">
            Contact us to order printed copies of our publications for your personal study or church library.
          </p>
          <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
