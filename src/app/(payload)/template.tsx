// Force all Payload CMS routes to be dynamically rendered at runtime
// This prevents build-time MongoDB connection timeouts on Netlify
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Log when this template is evaluated (should be at runtime, not build time)
if (typeof window === "undefined") {
  console.log("🎯 [payload/template.tsx] Template evaluated on server");
}

export default function PayloadTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
