"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function AboutSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [posterUrl, setPosterUrl] = useState<string>("");

  // Set slower playback speed, extract poster, and ensure mobile playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set slower playback rate for cinematic feel
    video.playbackRate = 0.7;

    // Function to attempt playing the video
    const attemptPlay = async () => {
      try {
        await video.play();
      } catch (e) {
        // Autoplay was prevented, try again on user interaction
        const playOnInteraction = () => {
          video.play().catch(() => {});
          document.removeEventListener('touchstart', playOnInteraction);
          document.removeEventListener('click', playOnInteraction);
        };
        document.addEventListener('touchstart', playOnInteraction, { once: true });
        document.addEventListener('click', playOnInteraction, { once: true });
      }
    };

    // Extract first frame as poster
    const handleLoadedData = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setPosterUrl(dataUrl);
        }
      } catch (e) {
        // Silently fail - video will just play without poster
      }
      // Attempt to play after loaded
      attemptPlay();
    };

    const handleCanPlay = () => {
      attemptPlay();
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleCanPlay);

    // Also try to play immediately if already loaded
    if (video.readyState >= 3) {
      attemptPlay();
    }

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const { scrollYProgress: textScrollProgress } = useScroll({
    target: textRef,
    offset: ["start end", "center center"],
  });

  // Adjusted parallax to prevent gap - minimal zoom
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["-5%", "10%"]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5], [1.05, 1]);
  const textOpacity = useTransform(textScrollProgress, [0, 0.5], [0, 1]);
  const textY = useTransform(textScrollProgress, [0, 0.5], [100, 0]);

  return (
    <section ref={containerRef} className="relative bg-stone-200 dark:bg-[#0d1220] transition-colors duration-300">
      {/* First Part - Full Width Video with Text Overlay */}
      <div className="relative h-screen overflow-hidden">
        {/* Background fill to prevent any gaps */}
        <div className="absolute inset-0 bg-stone-900 dark:bg-[#0d1220]" />

        <motion.div
          className="absolute inset-[-10%]"
          style={{ y: backgroundY }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ scale: imageScale }}
          >
            {/* Video Background with blur effect */}
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={posterUrl || undefined}
              className="w-full h-full object-cover blur-[2px]"
              {...{ "webkit-playsinline": "true" }}
              x-webkit-airplay="allow"
              disablePictureInPicture
              disableRemotePlayback
            >
              <source src="/videos/about-background.mp4" type="video/mp4" />
            </video>
          </motion.div>
          {/* 60% dark overlay for text readability */}
          <div className="absolute inset-0 bg-stone-900/60 dark:bg-[#0a0f1a]/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 via-stone-900/50 to-stone-900/30 dark:from-[#0a0f1a]/80 dark:via-[#0a0f1a]/50 dark:to-[#0a0f1a]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-200 via-transparent to-stone-900/20 dark:from-[#0d1220] dark:via-transparent dark:to-[#0a0f1a]/20" />
        </motion.div>

        {/* Content */}
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="inline-block text-secondary font-medium text-sm uppercase tracking-[0.3em] mb-6 drop-shadow-lg"
              >
                About Our Church
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-[1.1] drop-shadow-2xl"
                style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
              >
                A Church of
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-300 drop-shadow-none">
                  Faith & Purpose
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-white/80 text-lg md:text-xl leading-relaxed mb-8 drop-shadow-lg"
                style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
              >
                The Pentecostal Missionary Church of Christ (4th Watch) is an apostolic church
                committed to holiness, evangelism, and service unto the Lord.
                Our US District comprises approximately 50 local churches united in faith and mission.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <Link
                  href="/about"
                  className="inline-flex items-center gap-3 text-white font-medium group drop-shadow-lg"
                >
                  <span className="relative">
                    Discover Our Story
                    <span className="absolute bottom-0 left-0 w-0 h-px bg-secondary group-hover:w-full transition-all duration-500" />
                  </span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Counter on the right side */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block"
        >
          <div className="bg-stone-900/80 dark:bg-[#0a0f1a]/80 backdrop-blur-md border-l border-secondary/30 p-8 pr-16">
            <div className="text-right">
              <span className="font-serif text-7xl font-bold text-secondary drop-shadow-lg">50</span>
              <p className="text-white/70 text-sm uppercase tracking-[0.2em] mt-2">Local Churches</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Second Part - Text Reveal Section */}
      <div ref={textRef} className="relative py-32 lg:py-48 bg-stone-100 dark:bg-[#0d1220]">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto text-center"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-serif text-3xl md:text-5xl lg:text-6xl leading-[1.3] font-medium">
              <span className="text-slate-600 dark:text-white/85">We believe in </span>
              <span className="text-slate-900 dark:text-white">holiness of life</span>
              <span className="text-slate-600 dark:text-white/85">, </span>
              <span className="text-secondary">spiritual empowerment</span>
              <span className="text-slate-600 dark:text-white/85">, and </span>
              <span className="text-slate-900 dark:text-white">dedicated service</span>
              <span className="text-slate-600 dark:text-white/85"> to God and humanity.</span>
            </p>
          </motion.div>
        </div>

        {/* Decorative Lines */}
        <motion.div
          className="absolute left-1/2 top-0 w-px h-24 bg-gradient-to-b from-transparent to-slate-300 dark:to-white/10"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        />
        <motion.div
          className="absolute left-1/2 bottom-0 w-px h-24 bg-gradient-to-t from-transparent to-slate-300 dark:to-white/10"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        />
      </div>

      {/* Third Part - Feature Cards with Horizontal Scroll Effect */}
      <div className="relative pb-24 lg:pb-32 bg-stone-200 dark:bg-[#0d1220]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 dark:bg-white/5">
            {[
              {
                number: "01",
                title: "Biblical Foundation",
                desc: "Grounded in Scripture, pursuing truth and righteousness in all we do."
              },
              {
                number: "02",
                title: "Global Mission",
                desc: "Spreading the Gospel through Home Free Global Crusades worldwide."
              },
              {
                number: "03",
                title: "Community",
                desc: "A family united in faith, supporting one another's spiritual journey."
              },
              {
                number: "04",
                title: "Service",
                desc: "Dedicated to serving God and humanity with love and humility."
              },
            ].map((item, index) => (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group bg-white dark:bg-[#0d1220] p-8 lg:p-10 relative overflow-hidden"
              >
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative">
                  <span className="text-secondary/30 font-serif text-6xl font-bold block mb-6 group-hover:text-secondary/50 transition-colors duration-500">
                    {item.number}
                  </span>
                  <h3 className="font-serif text-xl lg:text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 dark:text-white/50 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                  <div className="absolute top-0 right-0 w-px h-8 bg-gradient-to-b from-secondary/50 to-transparent transform group-hover:h-12 transition-all duration-500" />
                  <div className="absolute top-0 right-0 w-8 h-px bg-gradient-to-l from-secondary/50 to-transparent transform group-hover:w-12 transition-all duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
