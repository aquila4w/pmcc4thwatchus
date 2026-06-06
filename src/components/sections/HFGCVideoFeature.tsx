"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

const OBB_VIDEO_URL = "https://images.pmcc4thwatch.us/HFGC/2026/New%20York/videos/hfgc-ny-obb.mp4";
const OBB_POSTER_URL = "https://images.pmcc4thwatch.us/HFGC/2026/New%20York/posters/poster-main.jpg";

export function HFGCVideoFeature() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.6 });
  const [muted, setMuted] = useState(true);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView && !hasPlayed) {
      video.muted = muted;
      video.play().then(() => setHasPlayed(true)).catch(() => {
        // Autoplay with sound blocked — try muted
        video.muted = true;
        setMuted(true);
        video.play().catch(() => {});
      });
    }
  }, [isInView, muted, hasPlayed]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !muted;
    video.muted = newMuted;
    setMuted(newMuted);
  };

  return (
    <section ref={sectionRef} className="relative py-16 sm:py-24 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10"
        >
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Official Video</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Home Free{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              New York 2026
            </span>
          </h2>
        </motion.div>

        {/* Video player — wider cinematic layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-orange-500/10"
        >
          <video
            ref={videoRef}
            src={OBB_VIDEO_URL}
            poster={OBB_POSTER_URL}
            className="w-full h-full object-cover"
            controls
            playsInline
            preload="auto"
          />

          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
