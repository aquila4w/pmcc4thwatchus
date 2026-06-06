"use client";

import { motion } from "framer-motion";
import { BookOpen, Globe, Users, Heart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Biblical Foundation",
    description: "Rooted in the Word of God, guided by the Holy Spirit",
  },
  {
    icon: Globe,
    title: "Global Mission",
    description: "Reaching nations with the gospel of Jesus Christ",
  },
  {
    icon: Users,
    title: "Community",
    description: "A family of believers united in faith and love",
  },
  {
    icon: Heart,
    title: "Service",
    description: "Dedicated to serving God and humanity",
  },
];

const STATS = [
  { value: "50+", label: "Local Churches" },
  { value: "8", label: "Sub-Districts" },
  { value: "1000+", label: "Active Members" },
];

export function HFGCChurchSection() {
  return (
    <section className="relative py-20 sm:py-28 bg-gradient-to-b from-black via-[#0a0f1a] to-[#0a0f1a] overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">About Us</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            A Church of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              Faith & Purpose
            </span>
          </h2>
          <p className="text-white/50 text-base sm:text-lg mt-4 max-w-3xl mx-auto leading-relaxed">
            The Pentecostal Missionary Church of Christ (4th Watch) is an apostolic church committed to
            holiness, evangelism, and service unto the Lord. Our US District comprises approximately 50
            local churches united in faith and mission.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-14">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center p-5 sm:p-6 rounded-xl bg-white/[0.03] border border-white/10"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-6 sm:gap-12 justify-center items-center mb-14"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                {stat.value}
              </p>
              <p className="text-xs text-white/40 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-300"
          >
            <Link href="/locate">
              <MapPin className="w-5 h-5 mr-2" />
              Locate Churches
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-6 rounded-xl border border-white/20 transition-all duration-300"
          >
            <Link href="/new-here">
              <Heart className="w-5 h-5 mr-2" />
              I&apos;m New Here
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
