"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { EventsSection } from "@/components/sections/EventsSection";
import { CTASection } from "@/components/sections/CTASection";

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
