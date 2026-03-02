"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Facebook, Youtube, Mail, ArrowUpRight } from "lucide-react";

const footerLinks = {
  ministry: [
    { label: "About Us", link: "/about" },
    { label: "Our Beliefs", link: "/about/beliefs" },
    { label: "Servant Leaders", link: "/about/leaders" },
    { label: "Locate Churches", link: "/locate" },
  ],
  resources: [
    { label: "Home Free Radio", link: "/radio" },
    { label: "Sermons", link: "/sermons" },
    { label: "Publications", link: "/publications" },
    { label: "Events Calendar", link: "/events" },
  ],
  connect: [
    { label: "I'm New Here", link: "/new-here" },
    { label: "Give", link: "/give" },
    { label: "Contact Us", link: "/contact" },
    { label: "Prayer Request", link: "/contact" },
  ],
};

export function Footer() {
  return (
    <footer className="relative bg-slate-200 dark:bg-[#050810] text-slate-800 dark:text-white overflow-hidden transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Main Footer */}
      <div className="relative container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src="/images/logo-colored.png"
                  alt="PMCC 4th Watch"
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-serif text-xl font-semibold">PMCC 4th Watch</span>
                <span className="text-slate-500 dark:text-white/40 text-xs block tracking-[0.3em] uppercase mt-1">US District</span>
              </div>
            </Link>
            <p className="text-slate-500 dark:text-white/40 text-sm leading-relaxed mb-8 max-w-sm">
              Pentecostal Missionary Church of Christ (4th Watch) - The end-time apostolic church
              committed to holiness, evangelism, and service unto the Lord.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/pmcc4thwatchusdistrict"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-white/50 hover:text-secondary hover:border-secondary/50 transition-all duration-300"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@SurerWord"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-white/50 hover:text-secondary hover:border-secondary/50 transition-all duration-300"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="mailto:info@pmcc4thwatch.us"
                className="w-11 h-11 rounded-full border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-white/50 hover:text-secondary hover:border-secondary/50 transition-all duration-300"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-secondary text-sm font-semibold uppercase tracking-[0.2em] mb-6">Ministry</h4>
                <ul className="space-y-4">
                  {footerLinks.ministry.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.link}
                        className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white text-sm transition-colors duration-300 flex items-center gap-2 group"
                      >
                        {link.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-secondary text-sm font-semibold uppercase tracking-[0.2em] mb-6">Resources</h4>
                <ul className="space-y-4">
                  {footerLinks.resources.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.link}
                        className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white text-sm transition-colors duration-300 flex items-center gap-2 group"
                      >
                        {link.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-secondary text-sm font-semibold uppercase tracking-[0.2em] mb-6">Connect</h4>
                <ul className="space-y-4">
                  {footerLinks.connect.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.link}
                        className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white text-sm transition-colors duration-300 flex items-center gap-2 group"
                      >
                        {link.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-slate-200 dark:border-white/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 dark:text-white/30 text-sm">
              © {new Date().getFullYear()} Pentecostal Missionary Church of Christ (4th Watch) US District | US IT & Website Team. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy-policy" className="text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors">
                Terms of Service
              </Link>
              <Link href="/dashboard" className="text-slate-400 dark:text-white/30 hover:text-secondary transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Large Background Text */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none select-none">
        <motion.p
          className="text-[20vw] font-serif font-bold text-slate-900/[0.03] dark:text-white/[0.02] leading-none whitespace-nowrap"
          initial={{ x: "0%" }}
          animate={{ x: "-50%" }}
          transition={{
            duration: 40,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          HOLINESS & SERVICE • HOLINESS & SERVICE •
        </motion.p>
      </div>
    </footer>
  );
}
