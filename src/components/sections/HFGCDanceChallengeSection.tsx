"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, X } from "lucide-react";

const VIDEO_SRC = "/videos/hfgc-dance-challenge.mp4";

export function HFGCDanceChallengeSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="relative py-20 sm:py-28 bg-[#0a0f1a] overflow-hidden">
      {/* Orange glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Join the Movement
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            HFGC{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              New York Challenge
            </span>
          </h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto text-base sm:text-lg">
            Watch the official HFGC Dance Challenge and join us in New York!
          </p>
        </motion.div>

        {/* Video thumbnail */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="group relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10 hover:border-orange-500/30 transition-all duration-300 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          {/* Video thumbnail (first frame) */}
          <video
            src={`${VIDEO_SRC}#t=0.5`}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
            muted
            preload="metadata"
          />

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-orange-500/90 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
              <Play className="w-7 h-7 text-white ml-1" />
            </div>
          </div>

          {/* Info bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white font-medium">HFGC Dance Challenge</p>
            <p className="text-white/40 text-xs mt-0.5">Official Challenge Video</p>
          </div>
        </motion.div>
      </div>

      {/* Video modal */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={VIDEO_SRC}
              className="w-full h-full object-contain"
              controls
              autoPlay
            />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </section>
  );
}
