import type { Metadata } from "next";

export const metadata: Metadata = { title: "Church Websites" };

export default function ChurchSitesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
