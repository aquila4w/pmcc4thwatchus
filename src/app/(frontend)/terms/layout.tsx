import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata: Metadata = generatePageMetadata("Terms of Service", "/terms");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
