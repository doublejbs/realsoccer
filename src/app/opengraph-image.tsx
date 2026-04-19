import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "realsoccer — 오늘 볼 경기, 한 번에";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0B",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          position: "relative",
          color: "#FAFAFA",
          fontFamily: "sans-serif",
        }}
      >
        {/* grid dots backdrop */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, #26262a 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
            opacity: 0.4,
          }}
        />

        {/* bottom decorative typography */}
        <div
          style={{
            position: "absolute",
            left: -30,
            bottom: -140,
            fontSize: 360,
            fontFamily: "serif",
            fontStyle: "italic",
            fontWeight: 700,
            color: "#121214",
            letterSpacing: "-0.06em",
            lineHeight: 1,
          }}
        >
          kickoff.
        </div>

        {/* top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              fontFamily: "serif",
              fontWeight: 700,
              fontSize: 40,
              letterSpacing: "-0.03em",
            }}
          >
            realsoccer
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                background: "#D4FF4A",
                marginLeft: 2,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              color: "#A1A1AA",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              border: "1px solid #26262A",
              padding: "6px 14px",
            }}
          >
            DAILY MATCH CURATION
          </div>
        </div>

        {/* main headline */}
        <div style={{ marginTop: 120, display: "flex", flexDirection: "column", zIndex: 2 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 20,
              color: "#71717A",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}
          >
            No. 01
          </div>
          <div
            style={{
              marginTop: 20,
              fontFamily: "serif",
              fontWeight: 700,
              fontSize: 160,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>오늘,</span>
            <span>
              <span style={{ fontStyle: "italic", color: "#D4FF4A" }}>한 경기만</span>
              <span> 보자.</span>
            </span>
          </div>
        </div>

        {/* bottom tagline */}
        <div
          style={{
            position: "absolute",
            left: 80,
            bottom: 60,
            fontSize: 26,
            color: "#A1A1AA",
            maxWidth: 720,
            lineHeight: 1.35,
            zIndex: 2,
          }}
        >
          수많은 경기 중 봐야 할 단 하나와, 왜 봐야 하는지.
        </div>
      </div>
    ),
    { ...size },
  );
}
