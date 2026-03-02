import type { Metadata } from "next";

console.log("🏠 [app/layout.tsx] Root layout module loaded");

// Force all routes to be dynamically rendered at runtime (not at build time)
// This prevents build timeouts from Payload CMS/MongoDB connections
export const dynamic = "force-dynamic";

const siteUrl = "https://pmcc4thwatch.us";

export const metadata: Metadata = {
  title: {
    default: "PMCC 4th Watch | US District",
    template: "%s | PMCC 4th Watch US District",
  },
  description: "Pentecostal Missionary Church of Christ (4th Watch) - An apostolic church committed to holiness, evangelism, and service unto the Lord. US District comprising approximately 50 local churches.",
  keywords: ["church", "PMCC", "4th Watch", "Pentecostal", "Christian", "US District", "apostolic", "holiness", "evangelism", "Home Free Global Crusade"],
  authors: [{ name: "PMCC 4th Watch US District" }],
  creator: "PMCC 4th Watch US District",
  publisher: "PMCC 4th Watch US District",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "PMCC 4th Watch US District",
    title: "PMCC 4th Watch | Holiness & Service Unto The Lord",
    description: "Pentecostal Missionary Church of Christ (4th Watch) - An apostolic church committed to holiness, evangelism, and service unto the Lord. Join our community of 50+ local churches across the US.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PMCC 4th Watch US District - Holiness & Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PMCC 4th Watch | Holiness & Service Unto The Lord",
    description: "Pentecostal Missionary Church of Christ (4th Watch) - An apostolic church committed to holiness, evangelism, and service unto the Lord.",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
