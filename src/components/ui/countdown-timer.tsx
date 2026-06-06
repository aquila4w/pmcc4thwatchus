"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Target: August 8, 2026 at 4:00 PM EST (UTC-4 in August = UTC 20:00)
const TARGET_DATE = new Date("2026-08-08T20:00:00Z").getTime();

function FlipDigit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 sm:w-20 md:w-24 h-14 sm:h-20 md:h-24 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
        {/* Center line */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/30" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -10, opacity: 0, rotateX: -90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: 10, opacity: 0, rotateX: 90 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center text-xl sm:text-3xl md:text-4xl font-bold text-white font-mono"
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-white/60 font-medium">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, TARGET_DATE - now);

      if (diff === 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-3 sm:gap-4 md:gap-6 justify-center">
        {["Days", "Hours", "Min", "Sec"].map((label) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="w-14 sm:w-20 md:w-24 h-14 sm:h-20 md:h-24 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10" />
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-white/60 font-medium">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-4 md:gap-6 justify-center">
      <FlipDigit value={timeLeft.days} label="Days" />
      <div className="flex items-center text-xl sm:text-2xl text-orange-400 font-bold self-start mt-3 sm:mt-5 md:mt-6">:</div>
      <FlipDigit value={timeLeft.hours} label="Hours" />
      <div className="flex items-center text-xl sm:text-2xl text-orange-400 font-bold self-start mt-3 sm:mt-5 md:mt-6">:</div>
      <FlipDigit value={timeLeft.minutes} label="Min" />
      <div className="flex items-center text-xl sm:text-2xl text-orange-400 font-bold self-start mt-3 sm:mt-5 md:mt-6">:</div>
      <FlipDigit value={timeLeft.seconds} label="Sec" />
    </div>
  );
}
