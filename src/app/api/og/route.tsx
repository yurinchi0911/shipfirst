import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "ShipFirst";
  const sub = searchParams.get("sub") ?? "Your first sale starts here";
  const type = searchParams.get("type") ?? "default"; // "product" | "maker" | "default"

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* grid dots */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
          }}
        />

        {/* brand */}
        <div
          style={{
            position: "absolute",
            top: "52px",
            left: "80px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(99,102,241,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            🚀
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: "22px",
              fontWeight: "700",
              letterSpacing: "-0.5px",
            }}
          >
            ShipFirst
          </span>
        </div>

        {/* type badge */}
        {type !== "default" && (
          <div
            style={{
              position: "absolute",
              top: "52px",
              right: "80px",
              padding: "6px 16px",
              borderRadius: "100px",
              border: "1px solid rgba(99,102,241,0.5)",
              background: "rgba(99,102,241,0.12)",
              color: "rgba(163,163,255,0.9)",
              fontSize: "14px",
              fontWeight: "500",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {type === "product" ? "Product" : "Maker"}
          </div>
        )}

        {/* main title */}
        <div
          style={{
            color: "#ffffff",
            fontSize: title.length > 40 ? "52px" : "64px",
            fontWeight: "800",
            lineHeight: "1.1",
            letterSpacing: "-2px",
            maxWidth: "900px",
            marginBottom: "20px",
          }}
        >
          {title}
        </div>

        {/* sub */}
        <div
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "26px",
            fontWeight: "400",
            letterSpacing: "-0.5px",
            maxWidth: "800px",
          }}
        >
          {sub}
        </div>

        {/* bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: "52px",
            right: "80px",
            color: "rgba(255,255,255,0.3)",
            fontSize: "16px",
            letterSpacing: "0.5px",
          }}
        >
          shipfirst.vercel.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
