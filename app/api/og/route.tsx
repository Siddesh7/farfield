import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              margin: "0",
              marginBottom: "20px",
            }}
          >
            Farfield
          </h1>
          <p
            style={{
              fontSize: "28px",
              margin: "0",
              marginBottom: "10px",
              opacity: 0.95,
            }}
          >
            Crypto-Native Marketplace
          </p>
          <p
            style={{
              fontSize: "20px",
              margin: "0",
              marginBottom: "40px",
              opacity: 0.8,
            }}
          >
            Built for the Farcaster community
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "20px",
              padding: "20px 40px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              borderRadius: "16px",
              border: "2px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <p
              style={{
                fontSize: "18px",
                margin: "0",
                marginBottom: "8px",
              }}
            >
              💰 Buy & Sell Digital Products
            </p>
            <p
              style={{
                fontSize: "18px",
                margin: "0",
              }}
            >
              🚀 Crypto Native • Community Driven
            </p>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800, // 3:2 aspect ratio as required by Farcaster
    }
  );
}
