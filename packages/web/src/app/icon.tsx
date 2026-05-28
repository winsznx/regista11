import { ImageResponse } from "next/og";

// Standard favicon size for Next.js file-based icon convention.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const runtime = "nodejs";

/**
 * Brand favicon — deep-plum square with an action-orange "11" wordmark.
 * Generated at request time, cached at the edge.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111a4a",
          color: "#ec652b",
          fontSize: 18,
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
