"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Users, Globe, Sparkles, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const timeline = [
  {
    year: "1972",
    title: "The Beginning",
    description: "Apostle Arsenio T. Ferriol founded the Pentecostal Missionary Church of Christ (4th Watch) in the Philippines, receiving a divine revelation about the imminent return of Christ in the 4th Watch.",
    image: "https://ext.same-assets.com/787474540/3658897796.png",
  },
  {
    year: "1975",
    title: "First Expansion",
    description: "The church began to grow rapidly, establishing multiple congregations across the Philippine islands. The message of holiness and service resonated deeply with believers.",
    image: "https://ext.same-assets.com/99090773/2311405131.jpeg",
  },
  {
    year: "1980s",
    title: "International Reach",
    description: "PMCC 4th Watch expanded beyond the Philippines, establishing churches in the United States, Canada, and other countries. The US District was officially formed.",
    image: "https://ext.same-assets.com/99090773/3086591134.jpeg",
  },
  {
    year: "1990s",
    title: "Home Free Global Crusade",
    description: "The Home Free Global Crusade (HFGC) was established as the church's flagship evangelistic outreach, bringing thousands to Christ annually through coordinated global campaigns.",
    image: "https://ext.same-assets.com/99090773/3778162446.jpeg",
  },
  {
    year: "2000s",
    title: "Global Growth",
    description: "The church expanded to six continents, with strong presence in Asia, North America, Europe, Africa, South America, and Australia. Training centers were established to develop leaders.",
    image: "https://ext.same-assets.com/99090773/2731046455.jpeg",
  },
  {
    year: "2010s",
    title: "Digital Ministry",
    description: "Embracing technology, the church launched online worship services, digital Bible studies, and social media outreach to reach the next generation of believers.",
    image: "https://ext.same-assets.com/99090773/1264729597.jpeg",
  },
  {
    year: "2020s",
    title: "Continuing the Mission",
    description: "Today, PMCC 4th Watch continues to grow with hundreds of congregations worldwide. The US District serves over 50 churches across 7 sub-districts, united in faith and mission.",
    image: "https://ext.same-assets.com/787474540/1158256995.webp",
  },
];

const milestones = [
  { number: "50+", label: "Years of Ministry" },
  { number: "100+", label: "Countries Reached" },
  { number: "1M+", label: "Lives Transformed" },
  { number: "50+", label: "US Churches" },
];

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f3]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-[#0a0f1a] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to About
            </Link>

            <div className="max-w-3xl">
              <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
                Our Journey
              </span>
              <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6">
                Our
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-300">
                  History
                </span>
              </h1>
              <p className="text-white/60 text-lg md:text-xl">
                From humble beginnings in the Philippines to a global movement of believers,
                discover how God has been faithful to PMCC 4th Watch through the years.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <span className="text-4xl md:text-5xl font-bold text-secondary block">
                  {milestone.number}
                </span>
                <span className="text-muted-foreground text-sm">{milestone.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
              Through the Years
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#0a0f1a] mb-4">
              A Timeline of Faith
            </h2>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className={`flex flex-col ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-8 mb-16`}>
                  {/* Year Marker - Mobile */}
                  <div className="md:hidden flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-[#0a0f1a] font-bold">{item.year}</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#0a0f1a]">{item.title}</h3>
                  </div>

                  {/* Image */}
                  <div className="md:w-1/2">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="md:w-1/2 flex flex-col justify-center">
                    {/* Year Marker - Desktop */}
                    <div className="hidden md:flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-[#0a0f1a] font-bold">{item.year}</span>
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-[#0a0f1a]">{item.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed md:pl-20">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Connecting Line */}
                {index < timeline.length - 1 && (
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-16 w-0.5 bg-gradient-to-b from-secondary to-secondary/20" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 bg-[#0a0f1a]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
                Our Founder
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
                Apostle Arsenio T. Ferriol
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                Apostle Arsenio T. Ferriol is the Goodman of the House and Apostle in the End-Time
                of the Pentecostal Missionary Church of Christ (4th Watch). Through his leadership
                and the divine calling upon his life, the church has grown from a small congregation
                to a global movement.
              </p>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                His teachings on holiness, service, and the imminent return of Christ have shaped
                the doctrine and practice of PMCC 4th Watch. Under his apostleship, the church
                has established hundreds of congregations worldwide.
              </p>
              <blockquote className="border-l-4 border-secondary pl-4 italic text-white/80">
                "We must live our lives on earth in holiness and service unto God,
                for we are watching and waiting in the 4th Watch."
              </blockquote>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2"
            >
              <div className="aspect-[3/4] rounded-2xl overflow-hidden max-w-md mx-auto">
                <img
                  src="https://ext.same-assets.com/787474540/3658897796.png"
                  alt="Apostle Arsenio T. Ferriol"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Looking Forward */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Sparkles className="w-12 h-12 text-secondary mx-auto mb-6" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0a0f1a] mb-6">
              Looking Forward
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              As we continue to watch and wait for the Lord's return, we remain committed to our
              mission of holiness and service. The best is yet to come as we press on toward the
              prize of the upward call of God in Christ Jesus.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Join us in this exciting journey of faith. Whether you're a lifelong believer or
              just beginning to explore Christianity, there's a place for you in PMCC 4th Watch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                <Link href="/locate">
                  Find a Church
                  <MapPin className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/about/leaders">
                  Meet Our Leaders
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
