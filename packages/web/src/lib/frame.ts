import type { Hex, Address } from "viem";

import { USDT0_ADDRESS, USDT0_DECIMALS } from "@/config/tokens";
import { getPersona } from "@/lib/personas";
import type { MarketRow } from "@/types/market";

import { DEPLOY_RUNBOOK_URL } from "@/lib/deployment";

/**
 * Farcaster Frame v2 server helpers.
 *
 * No client bundle impact — these are pure string builders + types.
 * The frame surface is entirely server-rendered HTML; Warpcast (and other
 * Farcaster clients) parse the meta tags and orchestrate the wallet flow.
 */

export type FrameAction = "post" | "tx" | "link" | "post_redirect" | "mint";

export interface FrameButton {
  label: string;
  action: FrameAction;
  /** For `tx` and `link`. Omitted for `post`. */
  target?: string;
  /** For `tx`: where Warpcast POSTs after the wallet signs. */
  postUrl?: string;
}

export interface FrameSpec {
  imageUrl: string;
  imageAspectRatio?: "1.91:1" | "1:1";
  inputPlaceholder?: string;
  buttons: FrameButton[];
  /** og:url + the body fallback link target. */
  fallbackUrl?: string;
  /** og:title + the body fallback heading. */
  title: string;
  /** og:description. */
  description?: string;
}

export interface FrameTxResponse {
  chainId: `eip155:${number}`;
  method: "eth_signTypedData_v4";
  params: {
    /** Empty per Farcaster Frame v2 spec for signTypedData. */
    abi: [];
    /** Verifying contract — USDT0 for EIP-3009 sigs. */
    to: Address;
    /** JSON-stringified EIP-712 typed data. */
    data: string;
  };
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

function htmlEscape(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Replacer for JSON.stringify that turns bigints into decimal strings — the
 * format MetaMask + WalletConnect both accept for uint256 fields in
 * eth_signTypedData_v4 typed data.
 */
export function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

/** Build the JSON response Warpcast expects from a `tx` action target. */
export function buildFrameTxResponse(typedData: {
  domain: Record<string, unknown>;
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
}): FrameTxResponse {
  return {
    chainId: "eip155:196",
    method: "eth_signTypedData_v4",
    params: {
      abi: [],
      to: USDT0_ADDRESS,
      data: JSON.stringify(typedData, bigintReplacer),
    },
  };
}

/* ──────────────────────── HTML renderer ──────────────────────── */

/** Serialize a FrameSpec into a complete `<!doctype html>` document. */
export function renderFrameHtml(spec: FrameSpec): string {
  const tags: string[] = [
    `<meta property="fc:frame" content="vNext" />`,
    `<meta property="fc:frame:image" content="${htmlEscape(spec.imageUrl)}" />`,
    `<meta property="fc:frame:image:aspect_ratio" content="${spec.imageAspectRatio ?? "1.91:1"}" />`,
    `<meta property="og:image" content="${htmlEscape(spec.imageUrl)}" />`,
    `<meta property="og:title" content="${htmlEscape(spec.title)}" />`,
  ];
  if (spec.description) {
    tags.push(`<meta property="og:description" content="${htmlEscape(spec.description)}" />`);
  }
  if (spec.fallbackUrl) {
    tags.push(`<meta property="og:url" content="${htmlEscape(spec.fallbackUrl)}" />`);
  }
  if (spec.inputPlaceholder) {
    tags.push(`<meta property="fc:frame:input:text" content="${htmlEscape(spec.inputPlaceholder)}" />`);
  }
  spec.buttons.slice(0, 4).forEach((b, i) => {
    const n = i + 1;
    tags.push(`<meta property="fc:frame:button:${n}" content="${htmlEscape(b.label)}" />`);
    tags.push(`<meta property="fc:frame:button:${n}:action" content="${b.action}" />`);
    if (b.target) {
      tags.push(`<meta property="fc:frame:button:${n}:target" content="${htmlEscape(b.target)}" />`);
    }
    if (b.postUrl) {
      tags.push(`<meta property="fc:frame:button:${n}:post_url" content="${htmlEscape(b.postUrl)}" />`);
    }
  });

  const body = renderFallbackBody(spec);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${htmlEscape(spec.title)}</title>
${tags.join("\n")}
</head>
<body>${body}</body>
</html>`;
}

function renderFallbackBody(spec: FrameSpec): string {
  const target = spec.fallbackUrl ?? "/";
  return `
<main style="font-family:system-ui,sans-serif;max-width:760px;margin:48px auto;padding:0 24px;color:#111a4a">
  <h1 style="font-size:22px;letter-spacing:-0.4px">${htmlEscape(spec.title)}</h1>
  <p style="color:#7c7f88;font-size:14px;line-height:1.5">
    This page is a Farcaster frame. Open it in a Farcaster client to stake;
    or follow the link to use the dApp.
  </p>
  <img src="${htmlEscape(spec.imageUrl)}" alt="${htmlEscape(spec.title)}" style="width:100%;max-width:600px;border-radius:8px;display:block;margin:24px 0" />
  <a href="${htmlEscape(target)}" style="display:inline-block;background:#ec652b;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:500">Open in Regista 11 →</a>
</main>`;
}

/* ──────────────────────── Common frame variants ──────────────────────── */

function imageUrlFor(market: Address): string {
  return `${APP_URL}/api/frame/${market}/image`;
}

function signUrlFor(market: Address, side: 1 | 2): string {
  return `${APP_URL}/api/frame/${market}/sign?side=${side}`;
}

function submitUrlFor(market: Address, side: 1 | 2): string {
  return `${APP_URL}/api/frame/${market}/submit?side=${side}`;
}

function marketFallbackUrl(market: Address): string {
  return `${APP_URL}/market/${market}`;
}

function frameQuestionTitle(market: MarketRow): string {
  const persona = market.agentPersona ? getPersona(market.agentPersona) : null;
  const personaName = persona?.name ?? "Regista 11";
  const question = market.humanQuestion ?? "Live prop market";
  return `${personaName} · ${question}`;
}

export function renderInitialFrame(market: MarketRow): string {
  return renderFrameHtml({
    imageUrl: imageUrlFor(market.address),
    title: frameQuestionTitle(market),
    description: "Stake OVER or UNDER · gasless USDT0 on X Layer",
    fallbackUrl: marketFallbackUrl(market.address),
    inputPlaceholder: "Amount in USDT0 (e.g. 5)",
    buttons: [
      {
        label: "Stake OVER",
        action: "tx",
        target: signUrlFor(market.address, 1),
        postUrl: submitUrlFor(market.address, 1),
      },
      {
        label: "Stake UNDER",
        action: "tx",
        target: signUrlFor(market.address, 2),
        postUrl: submitUrlFor(market.address, 2),
      },
    ],
  });
}

export function renderClosedMarketFrame(market: MarketRow): string {
  return renderFrameHtml({
    imageUrl: imageUrlFor(market.address),
    title: `${frameQuestionTitle(market)} — staking closed`,
    description: "This market has closed. Open the dApp to view resolution.",
    fallbackUrl: marketFallbackUrl(market.address),
    buttons: [
      {
        label: "View on regista11.xyz",
        action: "link",
        target: marketFallbackUrl(market.address),
      },
    ],
  });
}

export function renderSuccessFrame(
  market: MarketRow,
  txHash: Hex,
  side: 1 | 2,
  amountMicros: bigint,
): string {
  const sideLabel = side === 1 ? "OVER" : "UNDER";
  const dollars = formatDollarString(amountMicros);
  return renderFrameHtml({
    imageUrl: imageUrlFor(market.address),
    title: `✓ Staked $${dollars} on ${sideLabel}`,
    description: `${frameQuestionTitle(market)} — settled on X Layer`,
    fallbackUrl: marketFallbackUrl(market.address),
    buttons: [
      {
        label: "View tx on OKLink",
        action: "link",
        target: `https://www.oklink.com/x-layer/tx/${txHash}`,
      },
      {
        label: "Open market",
        action: "link",
        target: marketFallbackUrl(market.address),
      },
    ],
  });
}

export function renderErrorFrame(market: MarketRow | null, message: string): string {
  const target = market ? marketFallbackUrl(market.address) : APP_URL;
  const factoryDown = /deployment in progress/i.test(message);
  return renderFrameHtml({
    imageUrl: market
      ? imageUrlFor(market.address)
      : `${APP_URL}/api/frame/0x0000000000000000000000000000000000000000/image`,
    title: factoryDown ? "Mainnet deployment in progress" : `Stake failed — ${message}`,
    description: message,
    fallbackUrl: factoryDown ? DEPLOY_RUNBOOK_URL : target,
    buttons: [
      {
        label: factoryDown ? "View deploy runbook" : "Try again",
        action: factoryDown ? "link" : "post_redirect",
        target: factoryDown ? DEPLOY_RUNBOOK_URL : target,
      },
    ],
  });
}

function formatDollarString(micros: bigint): string {
  const whole = micros / 10n ** BigInt(USDT0_DECIMALS);
  const frac = micros % 10n ** BigInt(USDT0_DECIMALS);
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(USDT0_DECIMALS, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

export const FRAME_APP_URL = APP_URL;
