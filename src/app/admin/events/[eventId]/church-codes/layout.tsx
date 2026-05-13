import type { Metadata } from "next";

export const metadata: Metadata = { title: "Church Codes" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
