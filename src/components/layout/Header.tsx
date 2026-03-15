"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Facebook, Youtube, ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UserMenu } from "@/components/UserMenu";
import { useTheme } from "next-themes";

const navigation = [
  {
    label: "About Us",
    type: "dropdown",
    children: [
      { label: "Our Beliefs", link: "/about/beliefs" },
      { label: "Our Mission", link: "/about/mission" },
      { label: "Our History", link: "/about/history" },
      { label: "Servant Leaders", link: "/about/leaders" },
    ],
  },
  {
    label: "Crusades",
    type: "dropdown",
    children: [
      { label: "HFGC", link: "/hfgc" },
      { label: "Event Schedule", link: "/events" },
      { label: "Crusade Gallery", link: "/gallery" },
    ],
  },
  {
    label: "Media",
    type: "dropdown",
    children: [
      { label: "Home Free Radio", link: "/radio" },
      { label: "Sermons", link: "/sermons" },
      { label: "Publications", link: "/publications" },
    ],
  },
  {
    label: "Get Involved",
    type: "dropdown",
    children: [
      { label: "I'm New Here", link: "/new-here" },
      { label: "Locate a Church", link: "/locate" },
      { label: "Ministries", link: "/ministries" },
    ],
  },
  {
    label: "News & Events",
    type: "link",
    link: "/news-events",
  },
];

// Logo paths - local images
const LOGO_WHITE = "/images/logo-white.png";
const LOGO_COLORED = "/images/logo-colored.png";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  // Logo visibility logic:
  // Dark mode + not scrolled = white logo
  // Dark mode + scrolled = colored logo
  // Light mode + not scrolled = black logo (inverted white)
  // Light mode + scrolled = colored logo
  const showWhiteLogo = isDark && !isScrolled;
  const showColoredLogo = isScrolled; // Colored logo when scrolled in both themes
  const showBlackLogo = !isDark && !isScrolled; // Black logo only in light mode when not scrolled

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-white/95 dark:bg-[#0a0f1a]/95 backdrop-blur-xl py-2 shadow-lg dark:shadow-black/20"
            : "bg-white/80 dark:bg-[#0a0f1a]/80 backdrop-blur-md py-4 shadow-md dark:shadow-black/10"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo with scroll and theme transition */}
            <Link href="/" className="flex items-center group relative">
              <div className="relative w-16 h-16 md:w-[72px] md:h-[72px]">
                {/* White Logo - visible only in dark mode when not scrolled */}
                <motion.img
                  src={LOGO_WHITE}
                  alt="PMCC 4th Watch"
                  className="absolute inset-0 w-full h-full object-contain"
                  initial={false}
                  animate={{
                    opacity: showWhiteLogo ? 1 : 0,
                    scale: showWhiteLogo ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />

                {/* Colored Logo - visible when scrolled in both themes */}
                <motion.img
                  src={LOGO_COLORED}
                  alt="PMCC 4th Watch"
                  className="absolute inset-0 w-full h-full object-contain"
                  initial={false}
                  animate={{
                    opacity: showColoredLogo ? 1 : 0,
                    scale: showColoredLogo ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />

                {/* Black Logo (inverted white) - visible in light mode when not scrolled */}
                <motion.img
                  src={LOGO_WHITE}
                  alt="PMCC 4th Watch"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ filter: "invert(1)" }}
                  initial={false}
                  animate={{
                    opacity: showBlackLogo ? 1 : 0,
                    scale: showBlackLogo ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.type === "dropdown" && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.type === "link" ? (
                    <Link
                      href={item.link || "/"}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        isScrolled
                          ? "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                          : "text-slate-700 hover:text-slate-900 dark:text-white dark:hover:text-secondary"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                        isScrolled
                          ? "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                          : "text-slate-700 hover:text-slate-900 dark:text-white dark:hover:text-secondary"
                      }`}
                    >
                      {item.label}
                      <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${activeDropdown === item.label ? "rotate-180" : ""}`} />
                    </button>
                  )}

                  <AnimatePresence>
                    {activeDropdown === item.label && item.children && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 pt-4"
                      >
                        <div className="backdrop-blur-xl rounded-xl border py-3 min-w-[200px] shadow-2xl bg-white/95 dark:bg-[#0a0f1a]/95 border-slate-200 dark:border-white/10">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.link}
                              className="flex items-center justify-between px-5 py-2.5 text-sm transition-colors group text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5"
                            >
                              <span>{child.label}</span>
                              <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-1">
                <a
                  href="https://www.facebook.com/pmcc4thwatchusdistrict"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isScrolled
                      ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10"
                  }`}
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://www.youtube.com/@SurerWord"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isScrolled
                      ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10"
                  }`}
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
              <div className={`w-px h-6 ${isScrolled ? "bg-slate-200 dark:bg-white/10" : "bg-slate-300 dark:bg-white/20"}`} />
              <LanguageSwitcher variant="toggle" className={isScrolled ? "text-slate-600 dark:text-slate-300" : "text-slate-600 dark:text-white/90"} />
              <ThemeToggle />
              <UserMenu />
              <Link
                href="/give"
                className="px-5 py-2.5 bg-secondary text-[#0a0f1a] font-semibold text-sm rounded-full hover:bg-amber-300 transition-colors"
              >
                Give
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden w-10 h-10 flex items-center justify-center transition-colors ${
                isScrolled
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-800 dark:text-white"
              }`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-white dark:bg-[#0a0f1a] lg:hidden"
          >
            <div className="container mx-auto px-4 pt-24 pb-8 h-full overflow-y-auto">
              {/* Mobile Logo - use colored logo always in menu */}
              <div className="flex justify-center mb-8">
                <div className="relative w-24 h-24">
                  <Image
                    src={LOGO_COLORED}
                    alt="PMCC 4th Watch"
                    fill
                    sizes="96px"
                    className="object-contain"
                  />
                </div>
              </div>

              <nav className="space-y-6">
                {navigation.map((item) => (
                  <div key={item.label}>
                    <span className="text-secondary font-medium text-sm uppercase tracking-[0.2em]">
                      {item.label}
                    </span>
                    {item.children && (
                      <div className="mt-3 space-y-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.link}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white text-lg py-1 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <Link
                    href="/give"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-block px-8 py-4 bg-secondary text-[#0a0f1a] font-semibold rounded-full"
                  >
                    Give
                  </Link>
                  <ThemeToggle />
                </div>
                <div className="px-4 py-3 bg-slate-100 dark:bg-white/5 rounded-xl">
                  <UserMenu />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
