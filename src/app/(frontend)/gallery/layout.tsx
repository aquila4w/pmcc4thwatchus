import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata: Metadata = generatePageMetadata("Gallery", "/gallery");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
