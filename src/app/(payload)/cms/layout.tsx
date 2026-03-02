// Force all CMS pages to be dynamically rendered at runtime
// This prevents build-time MongoDB connection timeouts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

console.log("🎛️ [cms/layout.tsx] CMS layout loaded - dynamic rendering enabled");

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
