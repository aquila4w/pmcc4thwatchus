"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Gift, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

const REGISTER_URL = "/hfgc-ny";

const DETAILS = [
  { icon: Calendar, label: "Date", value: "August 8, 2026" },
  { icon: Clock, label: "Doors Open", value: "2:00 PM EST" },
  { icon: Clock, label: "Concert Begins", value: "4:00 PM EST" },
  { icon: MapPin, label: "Venue", value: "Meadowlands Expo Center, Secaucus, NJ" },
  { icon: Gift, label: "Admission", value: "FREE", highlight: true },
];

export function HFGCDetailsSection() {
  return (
    <section className="relative py-20 sm:py-28 bg-gradient-to-b from-black via-[#0a0f1a] to-black overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Event Details</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Be There on{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              August 8
            </span>
          </h2>
        </motion.div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {DETAILS.map((detail, i) => {
            const Icon = detail.icon;
            return (
              <motion.div
                key={detail.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`flex items-center gap-4 p-5 rounded-xl border backdrop-blur-sm ${
                  detail.highlight
                    ? "bg-gradient-to-br from-orange-500/20 to-amber-500/10 border-orange-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                  detail.highlight
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-white/10 text-white/60"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">{detail.label}</p>
                  <p className={`font-semibold ${detail.highlight ? "text-orange-400 text-xl" : "text-white"}`}>
                    {detail.value}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Large CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-lg px-10 py-7 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300"
          >
            <a href={REGISTER_URL}>
              <Ticket className="w-5 h-5 mr-2" />
              Register Now — It&apos;s Free
            </a>
          </Button>
          <p className="text-white/30 text-sm mt-4">
            No cost. Just show up and experience God&apos;s power.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
