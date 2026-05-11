import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LIFEFM.TV — Live Underground Music Radio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0908",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* Red accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "#e63030",
          }}
        />

        <div
          style={{
            color: "#e63030",
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: "-4px",
            lineHeight: 1,
          }}
        >
          LIFEFM.TV
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: 28,
            fontWeight: 400,
            marginTop: 24,
            letterSpacing: "3px",
          }}
        >
          LIVE UNDERGROUND MUSIC RADIO
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 17,
            marginTop: 18,
            letterSpacing: "5px",
          }}
        >
          DNB · DUB · JUNGLE · TECH HOUSE · SOUL
        </div>

        {/* Bottom left — location */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            left: 60,
            color: "rgba(255,255,255,0.25)",
            fontSize: 16,
            letterSpacing: "2px",
          }}
        >
          BROADCASTING FROM LONDON
        </div>

        {/* Bottom right — URL */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            right: 60,
            color: "rgba(230,48,48,0.7)",
            fontSize: 16,
            letterSpacing: "1px",
          }}
        >
          lifefm.tv
        </div>
      </div>
    ),
    { ...size }
  );
}
