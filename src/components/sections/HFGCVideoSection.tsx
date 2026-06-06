"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, X } from "lucide-react";

const VIDEO_BASE = "https://images.pmcc4thwatch.us/HFGC/2026/New%20York/videos/";

const VIDEOS = [
  {
    src: VIDEO_BASE + "new-york-ready.mp4",
    thumb: VIDEO_BASE + "new-york-ready.mp4#t=0.5",
    title: "New York, Are You Ready?",
    duration: "0:30",
  },
  {
    src: VIDEO_BASE + "bay-area-to-ny.mp4",
    thumb: VIDEO_BASE + "bay-area-to-ny.mp4#t=0.5",
    title: "From Bay Area to New York",
    duration: "0:30",
  },
];

export function HFGCVideoSection() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <section className="relative py-20 sm:py-28 bg-[#0a0f1a] overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Watch</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Feel the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              Energy
            </span>
          </h2>
        </motion.div>

        {/* Video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {VIDEOS.map((video, i) => (
            <motion.div
              key={video.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10 hover:border-orange-500/30 transition-all duration-300 cursor-pointer"
              onClick={() => setActiveVideo(video.src)}
            >
              {/* Video thumbnail (first frame) */}
              <video
                src={video.thumb}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                muted
                preload="metadata"
              />

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-orange-500/90 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </div>
              </div>

              {/* Info bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-medium text-sm">{video.title}</p>
                <p className="text-white/40 text-xs mt-0.5">{video.duration}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Video modal */}
      {activeVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
    </section>
  );
}
