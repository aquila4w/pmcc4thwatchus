import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata: Metadata = generatePageMetadata("News & Events", "/news-events");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
