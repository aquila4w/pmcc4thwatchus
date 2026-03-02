import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import "../globals.css";

console.log("🖼️ [frontend/layout.tsx] Frontend layout module loaded");

// Force all routes to be dynamically rendered at runtime (not at build time)
// This prevents build timeouts from Payload CMS/MongoDB connections
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
        `}
      </Script>
      <div className="antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </div>
    </>
  );
}
