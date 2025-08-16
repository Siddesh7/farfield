import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  const manifest = {
    accountAssociation: {
      header: "placeholder_header",
      payload: "placeholder_payload",
      signature: "placeholder_signature",
    },
    miniapp: {
      name: "Farfield",
      url: appUrl,
      description:
        "Buy and sell digital products from fellow Farcaster users in a crypto-native marketplace built for the community.",
      imageUrl: `${appUrl}/og.png`,
      version: "next",
      primaryCategory: "social",
      tags: ["social", "warpcast", "community", "friends", "compatibility"],
      heroImageUrl: `${appUrl}/api/og`,
      tagline: "Farcaster compatibility",
      ogTitle: "Farfield",
      iconUrl: `${appUrl}/logo.png`,
      splashImageUrl: `${appUrl}/og.png`,
      webhookUrl: `${appUrl}/webhookurl`,
      splashBackgroundColor: "#ffffff",
      homeUrl: appUrl,
      subtitle:
        "Buy and sell digital products from fellow Farcaster users in a crypto-native marketplace built for the community.",
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
