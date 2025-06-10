import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  const manifest = {
    // Note: You'll need to generate proper accountAssociation values when deploying
    // For now, using placeholder values for development
    accountAssociation: {
      header: "placeholder_header",
      payload: "placeholder_payload",
      signature: "placeholder_signature",
    },
    frame: {
      version: "1",
      name: "Farfield",
      iconUrl: `${appUrl}/api/og`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/api/og`,
      buttonTitle: "Open Farfield",
      splashImageUrl: `${appUrl}/api/og`,
      splashBackgroundColor: "#ffffff",
      // Optional fields for when you publish
      subtitle: "A Farcaster Mini App",
      description: "Connect your wallet and explore the Farcaster ecosystem",
      primaryCategory: "productivity",
      tags: ["farcaster", "wallet", "crypto"],
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
