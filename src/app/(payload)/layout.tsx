// Payload CMS route group layout
// We do NOT use RootLayout here because it creates html/head/body tags
// which would conflict with Next.js's root layout. Instead, we just include
// the CSS and let the admin routes handle their own layout.

import "./custom.scss";

export default function PayloadRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
