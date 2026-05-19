import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Church Website" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
