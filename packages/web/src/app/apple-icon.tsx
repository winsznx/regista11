import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "nodejs";

/** Apple touch icon — branded square, rounded by iOS automatically. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #05070f 0%, #111a4a 60%, #1a2670 100%)",
          color: "#ec652b",
          fontSize: 96,
          fontWeight: 700,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.04em",
        }}
      >
        11
      </div>
    ),
    size,
  );
}
