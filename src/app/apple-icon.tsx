import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderRadius: 32,
        }}
      >
        <div
          style={{
            fontSize: 130,
            color: "#FAFAFA",
            fontFamily: "serif",
            fontStyle: "italic",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          r
        </div>
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 34,
            width: 18,
            height: 18,
            borderRadius: 18,
            background: "#D4FF4A",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
