import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sermons" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
