"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";

const AboutSection = dynamic(
  () => import("@/components/sections/AboutSection").then((m) => ({ default: m.AboutSection })),
  { ssr: false }
);
const EventsSection = dynamic(
  () => import("@/components/sections/EventsSection").then((m) => ({ default: m.EventsSection })),
  { ssr: false }
);
const CTASection = dynamic(
  () => import("@/components/sections/CTASection").then((m) => ({ default: m.CTASection })),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0f1a] transition-colors duration-300">
      <Header />
      <HeroSection />
      <AboutSection />
      <EventsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
