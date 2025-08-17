import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  const manifest = {
    accountAssociation: {
      header:
        "eyJmaWQiOjI1MjcyMCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDlCOThkMTQ1Y0E5NWYwNGI1YTkzNTVGNDExMDFiODk4RjQ5NUU0OGQifQ",
      payload: "eyJkb21haW4iOiJmYXJmaWVsZC5zaG9wIn0",
      signature:
        "MHhlZjFmOTU2MjZkZTRhNDYwNTNiOTE2MDk4OGNhNDM4MmRiZDA2ZTlmMTdiNTU4N2NkODE3YjgyNzY1MTkyMzlhMDVmMDkwY2Q3NTc0YTAxZDBlY2RkMzk5ODBlMzhlYjIzZTc3NDVlNTA0MGFhOTdlM2ZhNDQxMzBmYzQ0NWI1MTFi",
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
      heroImageUrl: `${appUrl}/og.png`,
      tagline: "the social store",
      ogTitle: "Farfield",
      iconUrl: `${appUrl}/icon.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      webhookUrl: `${appUrl}/webhookurl`,
      splashBackgroundColor: "#000000",
      homeUrl: appUrl,
      subtitle: "the social store",
    },
    frame: {
      name: "Farfield",
      url: appUrl,
      description:
        "Buy and sell digital products from fellow Farcaster users in a crypto-native marketplace built for the community.",
      imageUrl: `${appUrl}/og.png`,
      version: "next",
      primaryCategory: "social",
      tags: ["social", "warpcast", "community", "friends", "compatibility"],
      heroImageUrl: `${appUrl}/og.png`,
      tagline: "the social store",
      ogTitle: "Farfield",
      iconUrl: `${appUrl}/icon.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      webhookUrl: `${appUrl}/webhookurl`,
      splashBackgroundColor: "#000000",
      homeUrl: appUrl,
      subtitle: "the social store",
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
