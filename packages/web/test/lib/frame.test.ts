import { describe, it, expect } from "vitest";

import type { Address, Hex } from "viem";

import {
  bigintReplacer,
  buildFrameTxResponse,
  renderErrorFrame,
  renderFrameHtml,
  renderSuccessFrame,
} from "@/lib/frame";
import { USDT0_ADDRESS } from "@/config/tokens";
import type { MarketRow } from "@/types/market";

const MARKET: MarketRow = {
  address: "0xefc51a4db2c5e2a8d7e8c8c8d7e8c8c8d7e8c8c8" as Address,
  agent: "0x1111111111111111111111111111111111111111" as Address,
  agentPersona: "il-regista",
  commitHash: "0xabc",
  paymentToken: USDT0_ADDRESS,
  marketDeadline: BigInt(Math.floor(Date.now() / 1000) + 1800),
  resolveDeadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
  state: "STAKING_OPEN",
  outcome: 0,
  overStakeTotal: 6n,
  underStakeTotal: 4n,
  revealedTemplateId: null,
  revealedParams: null,
  humanQuestion: "Will HOME keep a clean sheet in next 30'?",
  blockCreated: 1n,
};

describe("renderFrameHtml", () => {
  it("emits fc:frame=vNext + image + 1.91:1 aspect ratio meta tags by default", () => {
    const html = renderFrameHtml({
      imageUrl: "https://example.com/img.png",
      title: "Test frame",
      buttons: [{ label: "Tap", action: "post" }],
    });
    expect(html).toMatch(/<meta property="fc:frame" content="vNext"/);
    expect(html).toMatch(/<meta property="fc:frame:image" content="https:\/\/example\.com\/img\.png"/);
    expect(html).toMatch(/<meta property="fc:frame:image:aspect_ratio" content="1\.91:1"/);
    expect(html).toMatch(/<meta property="fc:frame:button:1" content="Tap"/);
  });
});

describe("buildFrameTxResponse", () => {
  it("returns chainId eip155:196 + signTypedData_v4 + USDT0 verifyingContract", () => {
    const out = buildFrameTxResponse({
      domain: { name: "USD₮0", version: "1", chainId: 196, verifyingContract: USDT0_ADDRESS },
      types: {},
      primaryType: "TransferWithAuthorization",
      message: {},
    });
    expect(out.chainId).toBe("eip155:196");
    expect(out.method).toBe("eth_signTypedData_v4");
    expect(out.params.to).toBe(USDT0_ADDRESS);
    expect(out.params.abi).toEqual([]);
    expect(typeof out.params.data).toBe("string");
    const parsed = JSON.parse(out.params.data) as { domain: { name: string } };
    expect(parsed.domain.name).toBe("USD₮0");
  });
});

describe("renderSuccessFrame", () => {
  it("includes the OKLink tx href for the supplied tx hash", () => {
    const tx: Hex = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    const html = renderSuccessFrame(MARKET, tx, 1, 5_000_000n);
    expect(html).toMatch(/Staked \$5 on OVER/);
    expect(html).toContain(`https://www.oklink.com/x-layer/tx/${tx}`);
  });
});

describe("renderErrorFrame", () => {
  it("escapes user-controlled error text so injected HTML cannot leak", () => {
    const html = renderErrorFrame(MARKET, '<script>alert("x")</script>');
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("bigintReplacer", () => {
  it("turns bigints into decimal strings for JSON.stringify", () => {
    const out = JSON.stringify({ value: 12345n, nested: { v: 9n } }, bigintReplacer);
    expect(out).toBe('{"value":"12345","nested":{"v":"9"}}');
  });
});
