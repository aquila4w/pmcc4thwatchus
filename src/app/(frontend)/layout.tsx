import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "PMCC 4th Watch | US District",
    template: "%s - PMCC 4th Watch | US District",
  },
};

// NOTE: Removed force-dynamic from layout. Static pages (about, beliefs, give, radio)
// are now statically generated and served from CDN. Only pages that need database
// data should set `export const dynamic = 'force-dynamic'` individually.

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
