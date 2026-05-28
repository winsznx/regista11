import { describe, it, expect, vi, beforeEach } from "vitest";

import type { Address } from "viem";
import type { MarketRow } from "@/types/market";
import type { WebDeployment } from "@/lib/deployment";

const FAKE_FACTORY = "0x9999999999999999999999999999999999999999" as Address;
const MARKET_ADDR = "0xefc51a4db2c5e2a8d7e8c8c8d7e8c8c8d7e8c8c8" as Address;

function makeDeployment(factory: Address | null): WebDeployment {
  return {
    chainId: 196,
    network: "xlayer-mainnet",
    factory,
    resolver: null,
    poolManager: "0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32" as Address,
    usdt0: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736" as Address,
    deployedAtBlock: factory ? 1n : null,
    deployedAtISO: null,
    agentsByPersona: null,
    personaByAgent: null,
    version: "test",
  };
}

let currentDeployment = makeDeployment(FAKE_FACTORY);
let currentMarket: MarketRow | null = null;

vi.mock("@/lib/deployment", () => ({
  get WEB_DEPLOYMENT() {
    return currentDeployment;
  },
  DEPLOY_RUNBOOK_URL: "https://github.com/winsznx/regista11/blob/main/packages/contracts/DEPLOYMENT.md",
  isFactoryDeployed: () => currentDeployment.factory !== null,
}));

vi.mock("@/lib/onchain", () => ({
  getMarketRow: vi.fn(async () => currentMarket),
}));

import { GET } from "@/app/frame/[market]/route";

const SAMPLE_MARKET: MarketRow = {
  address: MARKET_ADDR,
  agent: "0x2222222222222222222222222222222222222222" as Address,
  agentPersona: "il-regista",
  commitHash: "0xabc",
  paymentToken: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736" as Address,
  marketDeadline: BigInt(Math.floor(Date.now() / 1000) + 1800),
  resolveDeadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
  state: "STAKING_OPEN",
  outcome: 0,
  overStakeTotal: 67_000_000n,
  underStakeTotal: 33_000_000n,
  revealedTemplateId: null,
  revealedParams: null,
  humanQuestion: "Will HOME keep a clean sheet in next 30'?",
  blockCreated: 1n,
};

function callGet(addr: string) {
  return GET(new Request(`http://localhost/frame/${addr}`), {
    params: Promise.resolve({ market: addr }),
  });
}

describe("GET /frame/[market] — initial frame", () => {
  beforeEach(() => {
    currentDeployment = makeDeployment(FAKE_FACTORY);
    currentMarket = SAMPLE_MARKET;
  });

  it("returns 200 with text/html content-type for a valid open market", async () => {
    const res = await callGet(MARKET_ADDR);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
  });

  it("HTML contains fc:frame=vNext meta tag", async () => {
    const res = await callGet(MARKET_ADDR);
    const html = await res.text();
    expect(html).toMatch(/<meta property="fc:frame" content="vNext"/);
  });

  it("HTML contains both OVER + UNDER buttons with tx action", async () => {
    const res = await callGet(MARKET_ADDR);
    const html = await res.text();
    expect(html).toMatch(/<meta property="fc:frame:button:1" content="Stake OVER"/);
    expect(html).toMatch(/<meta property="fc:frame:button:1:action" content="tx"/);
    expect(html).toMatch(/<meta property="fc:frame:button:2" content="Stake UNDER"/);
    expect(html).toMatch(/<meta property="fc:frame:button:2:action" content="tx"/);
  });

  it("HTML contains the USDT0 amount input placeholder", async () => {
    const res = await callGet(MARKET_ADDR);
    const html = await res.text();
    expect(html).toMatch(/<meta property="fc:frame:input:text" content="Amount in USDT0/);
  });
});
