import type { Metadata } from "next";

// NOTE: Removed force-dynamic. Static frontend pages (about, beliefs, give, radio, etc.)
// are now statically generated and served from CDN. Only admin and dynamic routes
// (ticket, register, etc.) use force-dynamic in their own layouts.

const siteUrl = "https://pmcc4thwatch.us";

export const metadata: Metadata = {
  title: {
    default: "PMCC 4th Watch | US District",
    template: "%s - PMCC 4th Watch | US District",
  },
  description: "Pentecostal Missionary Church of Christ (4th Watch) - An apostolic church committed to holiness, evangelism, and service unto the Lord. US District comprising approximately 50 local churches.",
  keywords: ["church", "PMCC", "4th Watch", "Pentecostal", "Christian", "US District", "apostolic", "holiness", "evangelism", "Home Free Global Crusade"],
  authors: [{ name: "PMCC 4th Watch US District" }],
  creator: "PMCC 4th Watch US District",
  publisher: "PMCC 4th Watch US District",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "PMCC 4th Watch US District",
    title: "PMCC 4th Watch | US District",
    description: "PMCC 4th Watch | US District",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PMCC 4th Watch US District",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PMCC 4th Watch | US District",
    description: "PMCC 4th Watch | US District",
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
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
