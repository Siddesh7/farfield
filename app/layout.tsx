import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/providers/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generate frame metadata for Farcaster Mini App
const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Farfield - crypto-native marketplace for Farcaster",
  description:
    "Buy and sell digital products from fellow Farcaster users in a crypto-native marketplace built for the community.",
  keywords: [
    "farcaster",
    "crypto",
    "marketplace",
    "digital products",
    "web3",
    "creator economy",
  ],
  openGraph: {
    title: "Farfield - crypto-native marketplace",
    description:
      "Buy and sell digital products from fellow Farcaster users. A crypto-native marketplace built for the community.",
    images: [`${appUrl}/api/og`],
    siteName: "Farfield",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Farfield - crypto-native marketplace",
    description:
      "Buy and sell digital products from fellow Farcaster users. A crypto-native marketplace built for the community.",
    images: [`${appUrl}/api/og`],
  },
  other: {
    // Standard frame meta tags
    "fc:frame": "vNext",
    "fc:frame:image": `${appUrl}/api/og`,
    "fc:frame:button:1": "Explore Marketplace",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": appUrl,
    // Mini app specific tags
    "fc:frame:state": JSON.stringify({ type: "marketplace" }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon1.png" type="image/png" />
        <meta name="theme-color" content="#000000" />
        {/* Add to homescreen for Chrome on Android */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Farfield" />
        {/* Add to homescreen for Safari on iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Farfield" />
        <link rel="apple-touch-icon" href="/favicon1.png" />
        {/* Frame meta tags for better compatibility */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${appUrl}/api/og`} />
        <meta property="fc:frame:button:1" content="Explore Marketplace" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content={appUrl} />
        <meta property="og:image" content={`${appUrl}/api/og`} />
        <meta
          name="description"
          content="Buy and sell digital products from fellow Farcaster users in a crypto-native marketplace built for the community."
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
