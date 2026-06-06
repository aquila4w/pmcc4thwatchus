"use client";

import { motion } from "framer-motion";
import { Mic2, Music, Globe } from "lucide-react";

const ARTISTS = [
  {
    name: "Tasha Cobbs Leonard",
    title: "Grammy Award Winning Worship Singer",
    icon: Music,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    name: "Yeng Constantino",
    title: "Renowned Filipino Artist",
    icon: Mic2,
    gradient: "from-orange-500 to-red-600",
  },
  {
    name: "Jonathan S. Ferriol",
    title: "Global Evangelist",
    icon: Globe,
    gradient: "from-red-500 to-rose-600",
  },
];

export function HFGCArtistsSection() {
  return (
    <section className="relative py-20 sm:py-28 bg-black overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(251,146,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,146,60,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Featuring</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            An Unforgettable Night of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              Worship
            </span>
          </h2>
        </motion.div>

        {/* Artist cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {ARTISTS.map((artist, i) => {
            const Icon = artist.icon;
            return (
              <motion.div
                key={artist.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="group relative"
              >
                <div className="relative bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm hover:border-orange-500/30 transition-all duration-500">
                  {/* Icon circle */}
                  <div className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${artist.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  {/* Name */}
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{artist.name}</h3>
                  {/* Title */}
                  <p className="text-sm text-white/50">{artist.title}</p>
                  {/* Glow effect on hover */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${artist.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
