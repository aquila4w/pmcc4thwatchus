import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata: Metadata = generatePageMetadata("Member Login", "/member/login");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
