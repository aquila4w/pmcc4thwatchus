"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Globe, Heart, ArrowRight, Play } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const crusadeHighlights = [
  {
    icon: Globe,
    title: "Global Reach",
    description: "Reaching souls across continents through powerful evangelistic campaigns.",
  },
  {
    icon: Users,
    title: "Mass Gatherings",
    description: "Thousands come together to experience the power of God's Word.",
  },
  {
    icon: Heart,
    title: "Soul Winning",
    description: "Committed to bringing the lost to Christ through fervent preaching.",
  },
];

const upcomingCrusades = [
  {
    title: "Home Free Global Crusade 2026",
    date: "March 15-18, 2026",
    location: "Los Angeles Convention Center",
    image: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80",
  },
  {
    title: "Regional Soul Winning Summit",
    date: "June 20-22, 2026",
    location: "San Francisco, CA",
    image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80",
  },
];

export default function HFGCPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1a]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 min-h-[70vh] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1478147427282-58a87a120781?w=1920&q=80"
            alt="Home Free Global Crusade"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1a] via-[#0a0f1a]/80 to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block text-secondary text-sm uppercase tracking-[0.3em] mb-4"
          >
            Evangelistic Outreach
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6"
          >
            Home Free<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-300">
              Global Crusade
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/70 text-lg md:text-xl max-w-2xl mb-8"
          >
            Join thousands of believers as we gather to proclaim the Gospel,
            experience spiritual renewal, and witness the power of God transform lives.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a] font-bold px-8 py-6">
              <Link href="/events">
                View Schedule <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6">
              <Link href="/gallery">
                <Play className="mr-2 w-5 h-5" /> Watch Highlights
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 bg-[#0d1220]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {crusadeHighlights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-8"
              >
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                  <item.icon className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-white/60">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Crusades */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-secondary text-sm uppercase tracking-[0.3em] mb-4 block">
              Mark Your Calendar
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
              Upcoming Crusades
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {upcomingCrusades.map((crusade, index) => (
              <motion.div
                key={crusade.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src={crusade.image}
                    alt={crusade.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-serif text-2xl font-bold text-white mb-2">{crusade.title}</h3>
                  <div className="flex flex-wrap gap-4 text-white/70 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {crusade.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {crusade.location}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link href="/events">
                View All Events <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-secondary/10 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
              Be Part of Something Greater
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto mb-8">
              Join us as we reach the nations with the Gospel of Jesus Christ.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                <Link href="/new-here">Get Involved</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Link href="/give">Support the Mission</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
