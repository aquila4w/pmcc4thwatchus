"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence, useAnimationFrame } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, MapPin, Heart, ArrowRight } from "lucide-react";

// Letter by letter animation component - smooth fade on mobile, letter-by-letter on desktop
function AnimatedText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Mobile: single smooth fade-in for the whole word (no staggering)
  if (isMobile) {
    return (
      <motion.span
        className={className}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: delay * 0.3,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {text}
      </motion.span>
    );
  }

  // Desktop: letter-by-letter animation
  return (
    <span className={className}>
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ y: 100, opacity: 0, rotateX: -90 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          transition={{
            duration: 0.8,
            delay: delay + index * 0.04,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block"
          style={{ display: char === " " ? "inline" : "inline-block", transformStyle: "preserve-3d" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

// Magnetic button effect with glow
function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.2);
    y.set((e.clientY - centerY) * 0.2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={`relative ${className}`}
    >
      {isHovered && (
        <motion.div
          className="absolute -inset-4 bg-secondary/20 rounded-full blur-xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        />
      )}
      {children}
    </motion.div>
  );
}

// Morphing blob background
function MorphingBlob({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        borderRadius: [
          "60% 40% 30% 70% / 60% 30% 70% 40%",
          "30% 60% 70% 40% / 50% 60% 30% 60%",
          "60% 40% 30% 70% / 60% 30% 70% 40%",
        ],
        scale: [1, 1.1, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 20,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

// Aurora effect component
function AuroraEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-1/2 -left-1/4 w-[150%] h-[200%]"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(212,164,56,0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139,41,66,0.1) 0%, transparent 50%),
            radial-gradient(ellipse 100% 60% at 50% 100%, rgba(212,164,56,0.08) 0%, transparent 40%)
          `,
        }}
        animate={{
          x: [0, 50, 0, -50, 0],
          y: [0, -30, 0, 30, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// Digital grid with pulse effect
function DigitalGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Radial grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-secondary" />
          </pattern>
          <radialGradient id="fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="fadeMask">
            <rect width="100%" height="100%" fill="url(#fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" mask="url(#fadeMask)" />
      </svg>

      {/* Animated pulse rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-secondary/10"
            style={{
              width: 200 + i * 200,
              height: 200 + i * 200,
              left: -(100 + i * 100),
              top: -(100 + i * 100),
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 4,
              delay: i * 1.3,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Cursor follower with trail
function CursorFollower({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const springConfig = { damping: 25, stiffness: 200 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  return (
    <motion.div
      className="fixed pointer-events-none z-50 hidden md:block"
      style={{ x, y }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        <div className="w-4 h-4 rounded-full bg-secondary/30 blur-sm" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-secondary" />
      </div>
    </motion.div>
  );
}

// Glowing orbs
function GlowingOrbs({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Primary orb */}
      <motion.div
        className="absolute w-[600px] h-[600px]"
        style={{
          background: "radial-gradient(circle, rgba(212,164,56,0.12) 0%, transparent 60%)",
          left: "20%",
          top: "20%",
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary orb */}
      <motion.div
        className="absolute w-[500px] h-[500px]"
        style={{
          background: "radial-gradient(circle, rgba(139,41,66,0.08) 0%, transparent 60%)",
          right: "10%",
          bottom: "20%",
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Mouse-following subtle glow */}
      <motion.div
        className="absolute w-[400px] h-[400px] opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(212,164,56,0.1) 0%, transparent 50%)",
          x: mouseX - 200,
          y: mouseY - 200,
        }}
      />
    </div>
  );
}

// Flowing connections
function FlowingConnections() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="rgba(212,164,56,0.3)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Animated flowing line 1 */}
      <motion.path
        d="M0,300 Q400,200 800,350 T1600,300"
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 3, delay: 2, ease: "easeInOut" }}
      />

      {/* Animated flowing line 2 */}
      <motion.path
        d="M0,500 Q300,400 600,450 T1200,400 T1800,500"
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.5 }}
        transition={{ duration: 4, delay: 2.5, ease: "easeInOut" }}
      />

      {/* Traveling dot on path */}
      <motion.circle
        r="3"
        fill="rgba(212,164,56,0.6)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 6, delay: 3, repeat: Infinity }}
      >
        <animateMotion
          dur="6s"
          repeatCount="indefinite"
          path="M0,300 Q400,200 800,350 T1600,300"
          begin="3s"
        />
      </motion.circle>
    </svg>
  );
}

// Interactive floating particle component with trails
function InteractiveParticle({
  delay,
  duration,
  size,
  left,
  top,
  mouseX,
  mouseY,
}: {
  delay: number;
  duration: number;
  size: number;
  left: string;
  top: string;
  mouseX: number;
  mouseY: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const particleRef = useRef<HTMLDivElement>(null);

  const getDistanceEffect = useCallback(() => {
    if (!particleRef.current) return { scale: 1, glow: 0 };
    const rect = particleRef.current.getBoundingClientRect();
    const particleCenterX = rect.left + rect.width / 2;
    const particleCenterY = rect.top + rect.height / 2;
    const distance = Math.sqrt(
      Math.pow(mouseX - particleCenterX, 2) + Math.pow(mouseY - particleCenterY, 2)
    );
    const maxDistance = 200;
    const effect = Math.max(0, 1 - distance / maxDistance);
    return { scale: 1 + effect * 2, glow: effect };
  }, [mouseX, mouseY]);

  const { scale: proximityScale, glow } = getDistanceEffect();

  return (
    <motion.div
      ref={particleRef}
      className="absolute rounded-full cursor-pointer"
      style={{
        width: size,
        height: size,
        left,
        top,
        background: `radial-gradient(circle, rgba(212,164,56,${0.5 + glow * 0.5}) 0%, rgba(212,164,56,${0.1 + glow * 0.3}) 50%, transparent 100%)`,
        boxShadow: glow > 0.2 ? `0 0 ${30 * glow}px rgba(212,164,56,${glow * 0.6}), 0 0 ${60 * glow}px rgba(212,164,56,${glow * 0.3})` : 'none',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8 + glow * 0.2, 0],
        scale: [0, proximityScale, 0.3],
        y: [0, -150 - glow * 100, -300],
      }}
      whileHover={{
        scale: 3,
        opacity: 1,
        transition: { duration: 0.3 }
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border border-secondary/60"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 3, opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-secondary/30"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 5, opacity: [0, 0.5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Corner frame decoration
function CornerFrames() {
  const corners = [
    { position: 'top-8 left-8', rotate: 0 },
    { position: 'top-8 right-8', rotate: 90 },
    { position: 'bottom-24 left-8', rotate: 270 },
    { position: 'bottom-24 right-8', rotate: 180 },
  ];

  return (
    <>
      {corners.map((corner, index) => (
        <motion.div
          key={index}
          className={`absolute ${corner.position}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.5 + index * 0.1 }}
        >
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            fill="none"
            style={{ transform: `rotate(${corner.rotate}deg)` }}
          >
            <motion.path
              d="M0 50 L0 0 L50 0"
              stroke="rgba(212,164,56,0.3)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 2.5 + index * 0.1 }}
            />
            <motion.path
              d="M0 35 L0 15 L15 15 L15 0 L35 0"
              stroke="rgba(212,164,56,0.15)"
              strokeWidth="0.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 2.7 + index * 0.1 }}
            />
            <motion.circle
              cx="0"
              cy="0"
              r="4"
              fill="rgba(212,164,56,0.5)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 3 + index * 0.1 }}
            />
            {/* Pulsing dot */}
            <motion.circle
              cx="0"
              cy="0"
              r="6"
              fill="transparent"
              stroke="rgba(212,164,56,0.3)"
              strokeWidth="1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, delay: 3.5, repeat: Infinity }}
            />
          </svg>
        </motion.div>
      ))}
    </>
  );
}

// Animated vertical lines with traveling dots
function VerticalLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Left line */}
      <motion.div
        className="absolute left-[15%] top-0 w-px h-full"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 2, delay: 1.5 }}
        style={{ originY: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/15 to-transparent" />
        {/* Traveling dot */}
        <motion.div
          className="absolute w-3 h-3 -left-1"
          style={{
            background: "radial-gradient(circle, rgba(212,164,56,0.8) 0%, transparent 70%)",
          }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 2 }}
        />
      </motion.div>

      {/* Right line */}
      <motion.div
        className="absolute left-[85%] top-0 w-px h-full"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 2, delay: 1.7 }}
        style={{ originY: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/15 to-transparent" />
        {/* Traveling dot */}
        <motion.div
          className="absolute w-3 h-3 -left-1"
          style={{
            background: "radial-gradient(circle, rgba(212,164,56,0.8) 0%, transparent 70%)",
          }}
          animate={{ top: ['100%', '0%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 3 }}
        />
      </motion.div>

      {/* Center subtle line */}
      <motion.div
        className="absolute left-1/2 top-[20%] w-px h-[60%]"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 0.5 }}
        transition={{ duration: 2, delay: 2 }}
        style={{ originY: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/10 to-transparent" />
      </motion.div>
    </div>
  );
}

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [absoluteMousePosition, setAbsoluteMousePosition] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax transforms
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

  // Mobile parallax transforms (different speeds for layered depth effect)
  const mobileParallaxBg = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const mobileParallaxLight = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const mobileParallaxDove = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const mobileParallaxGlow1 = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const mobileParallaxGlow2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const mobileParallaxBokeh = useTransform(scrollYProgress, [0, 1], [0, 30]);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
      setAbsoluteMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Generate particles - fewer on mobile for performance
  const particles = useMemo(() => {
    const count = isMobile ? 12 : 20;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: i * (isMobile ? 0.15 : 0.25),
      duration: isMobile ? 3 + Math.random() * 3 : 5 + Math.random() * 5,
      size: 4 + Math.random() * 12,
      left: `${5 + Math.random() * 90}%`,
      top: `${40 + Math.random() * 50}%`,
    }));
  }, [isMobile]);

  return (
    <section
      ref={containerRef}
      className="relative h-screen overflow-hidden"
    >
      {/* Cursor follower */}
      {mounted && (
        <CursorFollower mouseX={absoluteMousePosition.x} mouseY={absoluteMousePosition.y} />
      )}

      {/* Base gradient background */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: bgY, scale }}
      >
        {/* Light mode: warm elegant gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-200 dark:from-[#0a0f1a] dark:via-[#0d1525] dark:to-[#0a0f1a]" />

        {/* Bible background image - shows on ALL devices */}
        {mounted && (
          <div className="absolute inset-0 overflow-hidden">
            {/* Bible image with Ken Burns animation */}
            <motion.div
              className="absolute -inset-[15%]"
              animate={{
                scale: [1, 1.1, 1.05, 1.12, 1],
                x: ["0%", "2%", "-1%", "1%", "0%"],
                y: ["0%", "-1%", "1%", "-0.5%", "0%"],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80"
                alt="Open Bible"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Dark mode overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/75 via-[#0a0f1a]/50 to-[#0a0f1a]/80 dark:block hidden" />
            <div className="absolute inset-0 bg-[#0a0f1a]/30 dark:block hidden" />

            {/* Light mode overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-100/80 via-amber-50/60 to-stone-100/85 dark:hidden block" />
            <div className="absolute inset-0 bg-white/20 dark:hidden block" />
          </div>
        )}

        {/* Subtle golden glows on top of Bible */}
        {mounted && (
          <>
            {/* Top right golden glow */}
            <motion.div
              className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full blur-3xl"
              style={{
                background: "radial-gradient(circle, rgba(212,164,56,0.2) 0%, transparent 70%)",
              }}
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Bottom left subtle glow */}
            <motion.div
              className="absolute -bottom-32 -left-20 w-[350px] h-[350px] rounded-full blur-3xl"
              style={{
                background: "radial-gradient(circle, rgba(212,164,56,0.15) 0%, transparent 70%)",
              }}
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Divine light rays from top */}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[50%]"
              style={{
                background: `
                  conic-gradient(
                    from 90deg at 50% 0%,
                    transparent 42%,
                    rgba(212,164,56,0.06) 46%,
                    rgba(212,164,56,0.1) 50%,
                    rgba(212,164,56,0.06) 54%,
                    transparent 58%
                  )
                `,
              }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Vignette effect */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.2) 100%)",
              }}
            />
          </>
        )}
      </motion.div>

      {/* Digital grid - desktop only */}
      {mounted && !isMobile && <DigitalGrid />}

      {/* Glowing orbs - desktop only */}
      {mounted && !isMobile && <GlowingOrbs mouseX={absoluteMousePosition.x} mouseY={absoluteMousePosition.y} />}

      {/* Flowing connections - desktop only */}
      {mounted && !isMobile && <FlowingConnections />}

      {/* Vertical lines with dots - desktop only */}
      {mounted && !isMobile && <VerticalLines />}

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] z-[1]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212,164,56,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,164,56,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Interactive floating particles - desktop only for smooth mobile experience */}
      {mounted && !isMobile && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="pointer-events-auto">
            {particles.map((particle) => (
              <InteractiveParticle
                key={particle.id}
                {...particle}
                mouseX={absoluteMousePosition.x}
                mouseY={absoluteMousePosition.y}
              />
            ))}
          </div>
        </div>
      )}

      {/* Corner frame decorations - desktop only */}
      {mounted && !isMobile && <CornerFrames />}

      {/* Mobile: no floating dots or complex animated elements, just subtle glows */}

      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-20 h-full flex flex-col items-center justify-center px-4"
        style={{ y: textY, opacity }}
      >
        {/* District Label */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isMobile ? 0.5 : 1, delay: isMobile ? 0.1 : 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl text-slate-600 dark:text-white/60 text-sm tracking-[0.25em] uppercase shadow-lg shadow-black/5">
            <motion.span
              className="w-2 h-2 rounded-full bg-secondary"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            US District
            <motion.span
              className="w-2 h-2 rounded-full bg-secondary"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </span>
        </motion.div>

        {/* Main Heading */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[10rem] font-bold text-slate-900 dark:text-white leading-[0.9] tracking-tight">
            <div className="overflow-hidden">
              <AnimatedText text="HOLINESS" delay={isMobile ? 0.15 : 0.8} />
            </div>
          </h1>
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.9] tracking-tight flex items-center justify-center flex-wrap">
            <span className="text-slate-900 dark:text-white">&</span>
            <motion.span
              className="ml-2 sm:ml-3 md:ml-4 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: isMobile ? 0.2 : 1.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Light mode: amber-600, Dark mode: secondary (gold) */}
              <span className="text-amber-600 dark:text-secondary">
                <AnimatedText text="SERVICE" delay={isMobile ? 0.25 : 1.2} />
              </span>
              {/* Glow effect behind text */}
              <motion.span
                className="absolute inset-0 text-amber-600 dark:text-secondary blur-2xl opacity-40 dark:opacity-30"
                aria-hidden
              >
                SERVICE
              </motion.span>
            </motion.span>
          </h1>
        </div>

        {/* Animated horizontal line with glow */}
        <motion.div
          className="relative w-32 h-px mb-8"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: isMobile ? 0.4 : 1, delay: isMobile ? 0.35 : 1.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary to-transparent" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary to-transparent blur-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isMobile ? 0.4 : 1, delay: isMobile ? 0.4 : 1.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-slate-500 dark:text-white/50 text-lg md:text-xl tracking-[0.4em] uppercase mb-12"
        >
          Unto The Lord
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isMobile ? 0.4 : 1, delay: isMobile ? 0.5 : 2.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <MagneticButton>
            <Button
              asChild
              size="lg"
              className="bg-secondary hover:bg-amber-400 text-[#0a0f1a] font-bold px-8 py-7 text-base rounded-full group relative overflow-hidden shadow-lg shadow-secondary/20"
            >
              <Link href="/locate">
                <span className="relative z-10 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Locate Churches
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                {/* Button shine effect */}
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </Link>
            </Button>
          </MagneticButton>

          <MagneticButton>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-300 dark:border-white/20 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 px-8 py-7 text-base rounded-full bg-white/70 dark:bg-transparent backdrop-blur-sm shadow-lg shadow-black/5"
            >
              <Link href="/new-here">
                <Heart className="w-5 h-5 mr-2" />
                I'm New Here
              </Link>
            </Button>
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Bottom Info Bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: isMobile ? 0.4 : 1, delay: isMobile ? 0.6 : 2.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 md:gap-6 border-t border-slate-200/50 dark:border-white/10 pt-8">
            {/* Church Name */}
            <div className="flex items-center text-slate-500 dark:text-white/40 text-sm order-1 md:order-1 text-center">
              <span className="tracking-[0.1em] md:tracking-[0.2em] uppercase text-[10px] md:text-sm">Pentecostal Missionary Church of Christ</span>
            </div>

            {/* 4TH WATCH - US DISTRICT */}
            <div className="flex items-center gap-4 md:gap-6 text-slate-500 dark:text-white/40 text-sm order-2 md:order-3">
              <span className="tracking-[0.15em] md:tracking-[0.2em] text-xs md:text-sm">4TH WATCH</span>
              <motion.span
                className="w-6 md:w-8 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent"
                animate={{ scaleX: [1, 1.5, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <span className="tracking-[0.15em] md:tracking-[0.2em] text-xs md:text-sm">US DISTRICT</span>
            </div>

            {/* Scroll Indicator */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center text-slate-500 dark:text-white/40 order-3 md:order-2"
            >
              <span className="text-xs tracking-[0.3em] uppercase mb-2">Scroll</span>
              <motion.div className="relative">
                <ChevronDown className="w-4 h-4" />
                <motion.div
                  className="absolute inset-0"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ChevronDown className="w-4 h-4 text-secondary" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Add gradient animation keyframes */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 4s ease infinite;
        }
      `}</style>
    </section>
  );
}
