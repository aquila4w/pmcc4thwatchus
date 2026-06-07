"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Music, Mic2, X } from "lucide-react";
import {
  ExpandingCards,
  type CardItem,
} from "@/components/ui/expanding-cards";

const ARTIST_CARDS: CardItem[] = [
  {
    id: "jonathan-ferriol",
    title: "Evg. Jonathan S. Ferriol",
    description: "Global Evangelist",
    imgSrc:
      "https://images.pmcc4thwatch.us/HFGC/2026/01%20-%20Manila/milestone/27.jpg",
    icon: <Globe className="w-6 h-6" />,
    linkHref:
      "https://images.pmcc4thwatch.us/HFGC/2026/01%20-%20Manila/milestone/29.mp4",
  },
  {
    id: "tasha-cobbs",
    title: "Tasha Cobbs Leonard",
    description: "Grammy Award Winning Worship Singer",
    imgSrc: "/images/tasha-cobbs.jpg",
    icon: <Music className="w-6 h-6" />,
    linkHref: "/videos/tasha-cobbs.mp4",
  },
  {
    id: "yeng-constantino",
    title: "Yeng Constantino",
    description: "Renowned Filipino Artist",
    imgSrc:
      "https://images.pmcc4thwatch.us/HFGC/2026/01%20-%20Manila/milestone/19.jpg",
    icon: <Mic2 className="w-6 h-6" />,
    linkHref:
      "https://images.pmcc4thwatch.us/HFGC/2026/01%20-%20Manila/milestone/20.mp4",
  },
];

export function HFGCArtistsSection() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

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
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Featuring
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            An Unforgettable Night of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              Worship
            </span>
          </h2>
        </motion.div>

        {/* Expanding artist cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center"
        >
          <ExpandingCards
            items={ARTIST_CARDS}
            defaultActiveIndex={0}
            onCardClick={(item) => {
              if (item.linkHref && item.linkHref !== "#") {
                setActiveVideo(item.linkHref);
              }
            }}
          />
        </motion.div>
      </div>

      {/* Video modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveVideo(null)}
          >
            <div
              className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={activeVideo}
                className="w-full h-full object-contain"
                controls
                autoPlay
              />
              <button
                onClick={() => setActiveVideo(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
