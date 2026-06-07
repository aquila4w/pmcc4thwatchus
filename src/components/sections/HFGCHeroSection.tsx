"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/ui/countdown-timer";

const HERO_IMG = "/images/hfgc-ny-hero.png?v=6";
const REGISTER_URL = "/hfgc-ny";
const CLOUDS_VIDEO = "/videos/ny-manhattan-night.mp4";

/* ---------------- WordsPullUp ---------------- */
function WordsPullUp({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 40, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
          </motion.span>
        );
      })}
    </div>
  );
}

/* ---------------- Searchlight Beams ---------------- */
function SearchlightBeams() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Beam 1 — from bottom-left, sweeping right */}
      <motion.div
        className="absolute origin-bottom"
        style={{
          left: "-10%",
          bottom: "-5%",
          width: "4px",
          height: "120vh",
          background: "linear-gradient(to top, rgba(251,191,36,0.9) 0%, rgba(251,191,36,0.3) 40%, rgba(251,191,36,0) 100%)",
          boxShadow: "0 0 120px 50px rgba(251,191,36,0.15), 0 0 300px 100px rgba(251,191,36,0.08)",
        }}
        animate={{ rotate: ["-30deg", "-10deg", "-25deg", "-5deg", "-30deg"] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Beam 2 — from bottom-right, sweeping left */}
      <motion.div
        className="absolute origin-bottom"
        style={{
          right: "-10%",
          bottom: "-5%",
          width: "4px",
          height: "120vh",
          background: "linear-gradient(to top, rgba(251,146,60,0.8) 0%, rgba(251,146,60,0.25) 40%, rgba(251,146,60,0) 100%)",
          boxShadow: "0 0 120px 50px rgba(251,146,60,0.12), 0 0 300px 100px rgba(251,146,60,0.06)",
        }}
        animate={{ rotate: ["20deg", "35deg", "10deg", "30deg", "20deg"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Beam 3 — center, slow sweep */}
      <motion.div
        className="absolute origin-bottom"
        style={{
          left: "45%",
          bottom: "-5%",
          width: "3px",
          height: "110vh",
          background: "linear-gradient(to top, rgba(253,224,71,0.7) 0%, rgba(253,224,71,0.2) 35%, rgba(253,224,71,0) 100%)",
          boxShadow: "0 0 100px 40px rgba(253,224,71,0.1), 0 0 250px 80px rgba(253,224,71,0.05)",
        }}
        animate={{ rotate: ["-15deg", "15deg", "-10deg", "10deg", "-15deg"] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Beam 4 — far left, wide glow */}
      <motion.div
        className="absolute origin-bottom"
        style={{
          left: "15%",
          bottom: "-5%",
          width: "5px",
          height: "110vh",
          background: "linear-gradient(to top, rgba(245,158,11,0.7) 0%, rgba(245,158,11,0.15) 40%, rgba(245,158,11,0) 100%)",
          boxShadow: "0 0 150px 60px rgba(245,158,11,0.1)",
        }}
        animate={{ rotate: ["-25deg", "-5deg", "-20deg", "0deg", "-25deg"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Beam 5 — from right-center */}
      <motion.div
        className="absolute origin-bottom"
        style={{
          right: "25%",
          bottom: "-5%",
          width: "3px",
          height: "115vh",
          background: "linear-gradient(to top, rgba(251,191,36,0.6) 0%, rgba(251,191,36,0.15) 38%, rgba(251,191,36,0) 100%)",
          boxShadow: "0 0 100px 40px rgba(251,191,36,0.1), 0 0 250px 80px rgba(251,191,36,0.04)",
        }}
        animate={{ rotate: ["15deg", "30deg", "5deg", "25deg", "15deg"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Beam 6 — from left-center, fast sweep */}
      <motion.div
        className="absolute origin-bottom"
        style={{
          left: "30%",
          bottom: "-5%",
          width: "3px",
          height: "105vh",
          background: "linear-gradient(to top, rgba(217,119,6,0.7) 0%, rgba(217,119,6,0.2) 35%, rgba(217,119,6,0) 100%)",
          boxShadow: "0 0 100px 40px rgba(217,119,6,0.1), 0 0 200px 70px rgba(217,119,6,0.05)",
        }}
        animate={{ rotate: ["-20deg", "10deg", "-15deg", "5deg", "-20deg"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Beam 7 — far right */}
      <motion.div
        className="absolute origin-bottom"
        style={{
          right: "5%",
          bottom: "-5%",
          width: "3px",
          height: "100vh",
          background: "linear-gradient(to top, rgba(253,224,71,0.6) 0%, rgba(253,224,71,0.12) 40%, rgba(253,224,71,0) 100%)",
          boxShadow: "0 0 80px 30px rgba(253,224,71,0.08), 0 0 180px 60px rgba(253,224,71,0.04)",
        }}
        animate={{ rotate: ["10deg", "25deg", "5deg", "20deg", "10deg"] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Beam 8 — near-left, slow wide sweep */}
      <motion.div
        className="absolute origin-bottom"
        style={{
          left: "5%",
          bottom: "-5%",
          width: "4px",
          height: "115vh",
          background: "linear-gradient(to top, rgba(251,146,60,0.65) 0%, rgba(251,146,60,0.18) 38%, rgba(251,146,60,0) 100%)",
          boxShadow: "0 0 120px 45px rgba(251,146,60,0.1), 0 0 250px 80px rgba(251,146,60,0.05)",
        }}
        animate={{ rotate: ["-35deg", "-15deg", "-30deg", "-10deg", "-35deg"] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ---------------- HFGCHeroSection ---------------- */
export function HFGCHeroSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  return (
    <section className="h-screen w-full relative overflow-hidden">

      {/* LAYER 0: Moving clouds video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.5) saturate(0.8)" }}
      >
        <source src={CLOUDS_VIDEO} type="video/mp4" />
      </video>

      {/* Dark overlay to let text/readability work */}
      <div className="absolute inset-0 bg-[#080c14]/30" />

      {/* Noise overlay */}
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay" />

      {/* LAYER 1: Searchlight beams sweeping across */}
      <SearchlightBeams />

      {/* LAYER 2: All text content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-end px-4 sm:px-6 md:px-10 pb-[32vh] sm:pb-[45vh] md:pb-[40vh]">
        <div className="w-full max-w-7xl grid grid-cols-12 items-start gap-2 sm:gap-4">

          {/* Left: Giant title */}
          <div className="col-span-12 lg:col-span-7 text-center">
            <h1 className="font-black leading-[0.85] tracking-[-0.07em] text-[17vw] sm:text-[14vw] md:text-[12vw] lg:text-[11vw] text-[#E1E0CC]">
              <WordsPullUp text="Home Free" />
            </h1>
            <h2 className="font-black leading-[0.85] tracking-[-0.05em] text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 text-[13vw] sm:text-[10vw] md:text-[8vw] lg:text-[5.5vw] mt-2 mb-4 sm:mt-1 sm:mb-0">
              <WordsPullUp text="New York" />
            </h2>
          </div>

          {/* Right: Details + CTA */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 items-center text-center lg:items-end lg:text-right lg:pt-8">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-orange-300 text-xs sm:text-sm font-medium uppercase tracking-wider">
                August 8, 2026 &middot; Meadowlands Expo Center
              </span>
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base text-white/80"
            >
              Evg. Jonathan S. Ferriol &middot; Tasha Cobbs Leonard &middot; Yeng Constantino
            </motion.p>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-xl font-semibold text-white tracking-[0.2em] uppercase"
            >
              Saved. Healed. Delivered.
            </motion.p>

            {/* Countdown */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-[10px] text-white/50 uppercase tracking-widest mb-2">Countdown</p>
              <CountdownTimer />
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <Button
                asChild
                className="group inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 py-2 pl-5 pr-1 text-sm font-medium text-white transition-all hover:gap-3 sm:text-base"
              >
                <a href={REGISTER_URL}>
                  Get Your FREE Ticket
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                    <ArrowRight className="h-4 w-4 text-orange-400" />
                  </span>
                </a>
              </Button>
            </motion.div>

          </div>
        </div>
      </div>

      {/* LAYER 3: Foreground image on top — CSS-only responsive */}
      <style>{`
        .hero-img-mobile { display: none; }
        .hero-img-desktop { display: flex; }
        @media (max-width: 767px) {
          .hero-img-mobile { display: block; }
          .hero-img-desktop { display: none; }
        }
      `}</style>

      {/* Mobile: cropped to show people */}
      <div className="hero-img-mobile absolute bottom-0 left-0 right-0 z-20 pointer-events-none overflow-hidden" style={{ height: "25vh" }}>
        <img
          src={HERO_IMG}
          alt=""
          className="w-full object-cover"
          style={{ height: "125%", objectPosition: "55% 37%" }}
        />
      </div>

      {/* Desktop: natural size, centered */}
      <div className="hero-img-desktop absolute bottom-0 left-0 right-0 z-20 pointer-events-none justify-center">
        <img
          src={HERO_IMG}
          alt=""
          className="max-w-full h-auto"
        />
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Scroll</span>
          <ArrowDown className="w-4 h-4 text-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
