import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/providers/provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-inter",
});

// Generate frame metadata for Farcaster Mini App
const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Farfield - the social store",
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
    title: "the social store",
    description:
      "Buy and sell digital products from fellow Farcaster users. A crypto-native marketplace built for the community.",
    images: [`${appUrl}/og.png`],
    siteName: "Farfield",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "the social store",
    description:
      "Buy and sell digital products from fellow Farcaster users. A crypto-native marketplace built for the community.",
    images: [`${appUrl}/api/og`],
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/og.png`,
      button: {
        title: "Explore Marketplace 🚀",
        action: {
          type: "launch_frame",
          name: "the social store",
          url: appUrl,
          splashImageUrl: `${appUrl}/splash.png`,
          splashBackgroundColor: "#7c3aed", // Farcaster purple
        },
      },
    }),
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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
