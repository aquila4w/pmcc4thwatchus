"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Volume2, VolumeX, Quote } from "lucide-react";

const TESTIMONY_VIDEO_URL = "https://images.pmcc4thwatch.us/HFGC/2026/New%20York/videos/warsaw-testimony.mp4";

export function HFGCTestimoniesSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.5 });
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView) {
      video.muted = muted;
      video.play().catch(() => {
        video.muted = true;
        setMuted(true);
        video.play().catch(() => {});
      });
    } else {
      video.pause();
    }
  }, [isInView, muted]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !muted;
    video.muted = newMuted;
    setMuted(newMuted);
  };

  return (
    <section ref={sectionRef} className="relative py-20 sm:py-28 bg-gradient-to-b from-[#0a0f1a] via-black to-black overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12"
        >
          <Quote className="w-8 h-8 text-orange-500/40 mx-auto mb-4" />
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Testimonies</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Changed{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              Lives
            </span>
          </h2>
          <p className="text-white/40 text-base sm:text-lg mt-3 max-w-xl mx-auto">
            Real stories of God&apos;s transforming power — salvation, healing, and deliverance.
          </p>
        </motion.div>

        {/* Featured testimony video */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-orange-500/5">
            <video
              ref={videoRef}
              src={TESTIMONY_VIDEO_URL}
              className="w-full h-full object-cover"
              controls
              playsInline
              preload="metadata"
            />
            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Caption */}
          <div className="mt-4 text-center">
            <p className="text-white/70 font-medium">Bro. Warsaw DelRosario</p>
            <p className="text-white/30 text-sm mt-1">From PTSD and depression to encountering God&apos;s healing power</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
