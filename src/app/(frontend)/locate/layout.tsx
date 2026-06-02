import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata: Metadata = generatePageMetadata("Locate a Church", "/locate");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
