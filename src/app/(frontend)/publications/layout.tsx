import type { Metadata } from "next";

export const metadata: Metadata = { title: "Publications" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
