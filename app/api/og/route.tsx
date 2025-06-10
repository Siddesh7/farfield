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
              fontSize: "64px",
              fontWeight: "bold",
              margin: "0",
              marginBottom: "20px",
            }}
          >
            Farfield
          </h1>
          <p
            style={{
              fontSize: "24px",
              margin: "0",
              opacity: 0.9,
            }}
          >
            Farcaster Mini App
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "40px",
              padding: "16px 32px",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              border: "2px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <p
              style={{
                fontSize: "18px",
                margin: "0",
              }}
            >
              Connect Wallet • Explore • Build
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
