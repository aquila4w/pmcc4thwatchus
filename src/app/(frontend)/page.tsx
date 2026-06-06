"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HFGCHeroSection } from "@/components/sections/HFGCHeroSection";

const HFGCArtistsSection = dynamic(
  () => import("@/components/sections/HFGCArtistsSection").then((m) => ({ default: m.HFGCArtistsSection })),
  { ssr: false }
);
const HFGCVideoFeature = dynamic(
  () => import("@/components/sections/HFGCVideoFeature").then((m) => ({ default: m.HFGCVideoFeature })),
  { ssr: false }
);
const HFGCDetailsSection = dynamic(
  () => import("@/components/sections/HFGCDetailsSection").then((m) => ({ default: m.HFGCDetailsSection })),
  { ssr: false }
);
const HFGCVideoSection = dynamic(
  () => import("@/components/sections/HFGCVideoSection").then((m) => ({ default: m.HFGCVideoSection })),
  { ssr: false }
);
const HFGCTestimoniesSection = dynamic(
  () => import("@/components/sections/HFGCTestimoniesSection").then((m) => ({ default: m.HFGCTestimoniesSection })),
  { ssr: false }
);
const HFGCDanceChallengeSection = dynamic(
  () => import("@/components/sections/HFGCDanceChallengeSection").then((m) => ({ default: m.HFGCDanceChallengeSection })),
  { ssr: false }
);
const HFGCCTASection = dynamic(
  () => import("@/components/sections/HFGCCTASection").then((m) => ({ default: m.HFGCCTASection })),
  { ssr: false }
);
const HFGCChurchSection = dynamic(
  () => import("@/components/sections/HFGCChurchSection").then((m) => ({ default: m.HFGCChurchSection })),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <HFGCHeroSection />
      <HFGCArtistsSection />
      <HFGCVideoFeature />
      <HFGCDetailsSection />
      <HFGCVideoSection />
      <HFGCTestimoniesSection />
      <HFGCDanceChallengeSection />
      <HFGCCTASection />
      <HFGCChurchSection />
      <Footer />
    </main>
  );
}
