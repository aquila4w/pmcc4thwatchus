import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata: Metadata = generatePageMetadata("Our History", "/about/history");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
