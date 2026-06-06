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
const HFGCCTASection = dynamic(
  () => import("@/components/sections/HFGCCTASection").then((m) => ({ default: m.HFGCCTASection })),
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
      <HFGCCTASection />
      <Footer />
    </main>
  );
}
