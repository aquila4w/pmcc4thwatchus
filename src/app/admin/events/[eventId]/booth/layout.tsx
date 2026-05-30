import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registration Booth - PMCC 4th Watch Admin",
};

export default function BoothLayout({ children }: { children: React.ReactNode }) {
  return children;
}
