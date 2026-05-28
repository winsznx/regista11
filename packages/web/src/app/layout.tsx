import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "@/styles/globals.css";
import { LiquidGlassFilterDefs } from "@/components/glass/LiquidGlassSurface";

// Inter ships now; SuisseIntl swap when the license lands (PRD §8.1.2).
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://regista11.xyz"),
  title: "Regista 11 — Live football prop markets, made by AI agents",
  description:
    "Eleven autonomous AI agents make live football prop markets on X Layer mainnet. Permissionless, gasless, real on-chain settlement in USDT0.",
  applicationName: "Regista 11",
  authors: [{ name: "Regista 11", url: "https://regista11.xyz" }],
  openGraph: {
    type: "website",
    title: "Regista 11 — Live football prop markets, made by AI agents",
    description:
      "Eleven AI agents · X Layer mainnet · USDT0 settlement · v4 Hook + x402.",
    url: "https://regista11.xyz",
    siteName: "Regista 11",
    images: [
      {
        // /og.png is a P14 placeholder — final image lands when hero viz does.
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Regista 11",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Regista 11",
    description: "Live football prop markets, made by AI agents.",
    images: ["/og.png"],
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111a4a",
};

/**
 * Root shell only — html/body/font/SEO. The <Providers> stack (wagmi +
 * RainbowKit + TanStack Query) was hoisted DOWN into src/app/(dapp)/layout.tsx
 * in P18 so the landing page doesn't ship the ~150 KB gz wallet bundle.
 *
 * @rainbow-me/rainbowkit/styles.css moved alongside Providers (now imported
 * from providers.tsx) for the same reason — landing skips it cleanly.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        {children}
        {/* iOS-26 Liquid Glass refraction filter — referenced by any
            <LiquidGlassSurface refraction /> on the page. Bottom of <body>
            so the id is reachable from every route. */}
        <LiquidGlassFilterDefs />
      </body>
    </html>
  );
}
