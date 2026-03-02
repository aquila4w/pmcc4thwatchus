"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import Link from "next/link";
import { MapPin, Radio, ArrowRight, Play } from "lucide-react";

// Magnetic button component
function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const stats = [
  { value: "50+", label: "Local Churches", suffix: "" },
  { value: "8", label: "Sub-Districts", suffix: "" },
  { value: "1000+", label: "Active Members", suffix: "" },
  { value: "25", label: "Years of Service", suffix: "+" },
];

export function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-5, 5]);

  return (
    <section ref={containerRef} className="relative py-32 lg:py-48 bg-slate-200 dark:bg-[#080c14] overflow-hidden transition-colors duration-300">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(100,100,100,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,100,100,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-20 w-64 h-64 rounded-full bg-secondary/5 blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        animate={{
          x: [0, -30, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-4 relative">
        {/* Main CTA Content */}
        <div className="max-w-5xl mx-auto text-center mb-20">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-6"
          >
            Join Our Community
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-8 leading-[1.1]"
          >
            Ready to Experience
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary via-amber-300 to-secondary">
              God's Love?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-500 dark:text-white/50 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Whether you're looking for a church home, wanting to grow in your faith,
            or seeking to serve others, there's a place for you here.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <MagneticButton>
              <Link
                href="/locate"
                className="inline-flex items-center gap-3 px-8 py-5 bg-secondary text-[#0a0f1a] font-bold rounded-full group hover:bg-amber-300 transition-colors duration-300"
              >
                <MapPin className="w-5 h-5" />
                <span>Find a Church</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </MagneticButton>

            <MagneticButton>
              <Link
                href="/radio"
                className="inline-flex items-center gap-3 px-8 py-5 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white font-medium rounded-full group hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-300"
              >
                <Radio className="w-5 h-5" />
                <span>Listen to Home Free Radio</span>
              </Link>
            </MagneticButton>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative"
        >
          {/* Divider Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent via-slate-300 dark:via-white/20 to-transparent" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-20 border-t border-slate-200 dark:border-white/5">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="text-center group cursor-default"
                onMouseEnter={() => setHoveredStat(index)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <motion.div
                  animate={{
                    scale: hoveredStat === index ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-slate-700 to-slate-400 dark:from-white dark:to-white/50">
                    {stat.value}
                  </span>
                </motion.div>
                <p className="text-slate-400 dark:text-white/40 text-sm uppercase tracking-[0.2em] mt-3 group-hover:text-secondary transition-colors duration-300">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Video CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-32 relative"
        >
          <div className="relative rounded-3xl overflow-hidden aspect-video max-w-4xl mx-auto shadow-2xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://ext.same-assets.com/99090773/2731046455.jpeg')`,
              }}
            />
            <div className="absolute inset-0 bg-black/40" />

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <MagneticButton>
                <button
                  type="button"
                  className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center group hover:bg-amber-300 transition-colors duration-300"
                >
                  <Play className="w-10 h-10 text-[#0a0f1a] ml-1" fill="currentColor" />
                </button>
              </MagneticButton>
            </div>

            {/* Caption */}
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
              <div>
                <p className="text-white/60 text-sm uppercase tracking-[0.2em] mb-1">Watch</p>
                <p className="text-white font-serif text-2xl font-semibold">Our Story</p>
              </div>
              <div className="text-white/40 text-sm">
                2:45 min
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
