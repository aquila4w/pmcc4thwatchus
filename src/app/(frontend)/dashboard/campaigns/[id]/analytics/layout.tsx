import type { Metadata } from "next";

export const metadata: Metadata = { title: "Campaign Analytics" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
