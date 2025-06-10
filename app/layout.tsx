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
  title: "Farfield - Farcaster Mini App",
  description: "A Farcaster Mini App built with Next.js and Privy",
  openGraph: {
    title: "Farfield",
    description: "A Farcaster Mini App built with Next.js and Privy",
    images: [`${appUrl}/api/og`],
  },
  other: {
    // Standard frame meta tags
    "fc:frame": "vNext",
    "fc:frame:image": `${appUrl}/api/og`,
    "fc:frame:button:1": "Open App",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": appUrl,
    // Mini app specific tags
    "fc:frame:state": JSON.stringify({ type: "mini-app" }),
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
        {/* Frame meta tags for better compatibility */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${appUrl}/api/og`} />
        <meta property="fc:frame:button:1" content="Open App" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content={appUrl} />
        <meta property="og:image" content={`${appUrl}/api/og`} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
