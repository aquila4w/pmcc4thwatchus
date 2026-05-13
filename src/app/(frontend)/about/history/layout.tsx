import type { Metadata } from "next";

export const metadata: Metadata = { title: "Our History" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
