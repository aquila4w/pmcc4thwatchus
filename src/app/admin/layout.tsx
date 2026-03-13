import { AdminDashboardLayout } from "./AdminDashboardLayout";
import "../globals.css";

console.log("🏛️ [admin/layout.tsx] Admin layout module loaded");

// Force all routes to be dynamically rendered at runtime (not at build time)
// This prevents build timeouts from Payload CMS/MongoDB connections
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}
