import {
  createPublicClient,
  http,
  parseAbiItem,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { xLayer } from "wagmi/chains";

import { PropMarketHookABI } from "@/abis/PropMarketHook";
import { PropMarketHookFactoryABI } from "@/abis/PropMarketHookFactory";
import { IUSDT0ABI } from "@/abis/IUSDT0";

import { WEB_DEPLOYMENT } from "./deployment";
import { decodeRevealedParams } from "./templates";

import type { MarketOutcome, MarketRow, MarketState } from "@/types/market";

let _client: PublicClient | null = null;

/** Lazy singleton public client bound to X Layer mainnet. */
export function getPublicClient(): PublicClient {
  if (_client) return _client;
  _client = createPublicClient({
    chain: xLayer,
    transport: http("https://rpc.xlayer.tech"),
  }) as PublicClient;
  return _client;
}

const MARKET_CREATED_EVENT = parseAbiItem(
  "event MarketCreated(bytes32 indexed matchId, address indexed agent, address hook, bytes32 poolId, bytes32 commitHash, uint64 marketDeadline)",
);

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
const CACHE = new Map<string, CacheEntry<unknown>>();
// Bumped from 15s after the chunked getLogs scan started hitting X Layer
// RPC rate limits — re-scanning the same window every 15s blew the
// per-second budget for free public RPC. 60s is comfortable for the
// /markets list which refreshes on user interaction anyway.
const TTL_MS = 60_000;

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = CACHE.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > now) return hit.value;
  const value = await loader();
  CACHE.set(key, { value, expiresAt: now + TTL_MS });
  return value;
}

/** Test-only: drop everything in the in-memory read cache. */
export function clearOnchainCache(): void {
  CACHE.clear();
}

export interface FactoryMarketEvent {
  marketAddress: Address;
  agent: Address;
  matchId: Hex;
  commitHash: Hex;
  marketDeadline: bigint;
  blockNumber: bigint;
}

/**
 * Scan the factory's MarketCreated log range. Returns [] when the factory
 * address is null (pre-deploy) — never throws on the undeployed path.
 */
export async function getFactoryMarkets(): Promise<FactoryMarketEvent[]> {
  if (!WEB_DEPLOYMENT.factory) return [];
  const fromBlock = WEB_DEPLOYMENT.deployedAtBlock ?? 0n;

  return cached(`factory-markets:${WEB_DEPLOYMENT.factory}:${fromBlock}`, async () => {
    const client = getPublicClient();

    // X Layer's free RPC enforces TWO constraints on eth_getLogs:
    //   1. Each call's block range must be ≤ 100 blocks ("over 100 max")
    //   2. Aggregate calls per second are rate-limited ("over rate limit")
    //
    // We satisfy (1) by chunking into 100-block windows. We satisfy (2)
    // by capping the scan depth to MAX_CHUNKS × 100 blocks (~2.8h at
    // X Layer's ~2s block time) and walking the chunks with low
    // parallelism + a 429-retry with backoff. The 60s cache (above)
    // absorbs repeat reads. Markets minted earlier than the scan window
    // remain reachable via the deep-link /market/[address] page.
    const CHUNK = 100n;
    const PARALLEL = 3;
    const MAX_CHUNKS = 50;
    const LOOKBACK_BLOCKS = BigInt(MAX_CHUNKS) * CHUNK; // 5_000
    const latest = await client.getBlockNumber();
    const scanFrom = fromBlock > latest - LOOKBACK_BLOCKS
      ? fromBlock
      : latest - LOOKBACK_BLOCKS;

    const ranges: Array<{ from: bigint; to: bigint }> = [];
    for (let cursor = scanFrom; cursor <= latest; cursor += CHUNK) {
      const to = cursor + CHUNK - 1n;
      ranges.push({ from: cursor, to: to > latest ? latest : to });
    }

    // Type carrier: one successful call's return type carries decoded
    // `args` because we pass the typed `event:` arg below. Using the
    // inferred type as the chunk-result type preserves that narrowing.
    type ChunkResult = Awaited<
      ReturnType<typeof client.getLogs<typeof MARKET_CREATED_EVENT>>
    >;

    // Fetch with bounded parallelism + 429-aware retry. A single chunk
    // failing is non-fatal — we collect the rest. This trades some
    // completeness for resilience against transient RPC rate spikes,
    // which is the right call for a public read endpoint.
    const fetchChunk = async (
      r: { from: bigint; to: bigint },
      attempt = 0,
    ): Promise<ChunkResult> => {
      try {
        return await client.getLogs({
          address: WEB_DEPLOYMENT.factory!,
          event: MARKET_CREATED_EVENT,
          fromBlock: r.from,
          toBlock: r.to,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const isRateLimit =
          msg.includes("rate limit") ||
          msg.includes("429") ||
          msg.includes("over rate");
        if (isRateLimit && attempt < 3) {
          await new Promise((res) => setTimeout(res, 600 * (attempt + 1)));
          return fetchChunk(r, attempt + 1);
        }
        return [] as unknown as ChunkResult;
      }
    };

    const batches: ChunkResult = [] as unknown as ChunkResult;
    for (let i = 0; i < ranges.length; i += PARALLEL) {
      const batch = ranges.slice(i, i + PARALLEL);
      const results = await Promise.all(batch.map((r) => fetchChunk(r)));
      for (const r of results) batches.push(...r);
    }

    return batches.map((log) => ({
      marketAddress: log.args.hook as Address,
      agent: log.args.agent as Address,
      matchId: log.args.matchId as Hex,
      commitHash: log.args.commitHash as Hex,
      marketDeadline: BigInt(log.args.marketDeadline ?? 0),
      blockNumber: log.blockNumber ?? 0n,
    }));
  });
}

/**
 * Read a single market's full state and project it into the flat MarketRow
 * shape consumed by UI components.
 */
export async function getMarketRow(address: Address): Promise<MarketRow | null> {
  if (!WEB_DEPLOYMENT.factory) return null;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return null;

  return cached(`market-row:${address}`, async () => {
    const client = getPublicClient();
    const [marketTuple, blockNumber] = await Promise.all([
      client.readContract({
        address,
        abi: PropMarketHookABI,
        functionName: "market",
      }),
      client.getBlockNumber(),
    ]);

    // PropMarketHook.market() returns the Market struct as a positional tuple.
    const [
      commitHash,
      _revealedParamsHash,
      revealedParams,
      commitBlock,
      _revealDeadline,
      marketDeadline,
      resolveDeadline,
      agent,
      totalYes,
      totalNo,
      outcomeRaw,
    ] = marketTuple as unknown as [
      Hex,
      Hex,
      Hex,
      bigint,
      bigint,
      bigint,
      bigint,
      Address,
      bigint,
      bigint,
      number,
    ];

    const outcome = (Number(outcomeRaw) as MarketOutcome) ?? 0;
    const state = deriveState({
      outcome,
      marketDeadline,
      hasReveal: revealedParams !== "0x" && revealedParams.length > 2,
    });

    const decoded = revealedParams && revealedParams !== "0x" ? decodeRevealedParams(revealedParams) : null;

    return {
      address,
      agent,
      agentPersona: WEB_DEPLOYMENT.personaByAgent?.get(agent) ?? null,
      commitHash,
      paymentToken: WEB_DEPLOYMENT.usdt0,
      marketDeadline,
      resolveDeadline,
      state,
      outcome,
      overStakeTotal: totalYes,
      underStakeTotal: totalNo,
      revealedTemplateId: decoded ? decoded.templateId : null,
      revealedParams: revealedParams || null,
      humanQuestion: decoded ? decoded.humanQuestion : null,
      blockCreated: commitBlock ?? blockNumber,
    } satisfies MarketRow;
  });
}

function deriveState(args: {
  outcome: MarketOutcome;
  marketDeadline: bigint;
  hasReveal: boolean;
}): MarketState {
  if (args.outcome === 3) return "REFUNDED";
  if (args.outcome === 1 || args.outcome === 2) return "RESOLVED";
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (!args.hasReveal && now < args.marketDeadline) return "STAKING_OPEN";
  return "AWAITING_REVEAL";
}

/**
 * Combined list reader: scan factory events, then read each market's state
 * via Promise.all (multicall would batch tighter but viem's multicall
 * requires the X Layer multicall3 deployment to be configured; Promise.all
 * is fine at our P16 scale).
 */
export async function getAllMarketRows(): Promise<MarketRow[]> {
  const events = await getFactoryMarkets();
  if (events.length === 0) return [];
  const rows = await Promise.all(events.map((e) => getMarketRow(e.marketAddress)));
  return rows.filter((r): r is MarketRow => r !== null);
}

/**
 * For each known persona wallet, read `registeredAgents(addr)` from the
 * factory. Returns the set of persona slugs the factory has registered.
 */
export async function getAgentRegistrations(): Promise<{
  registered: Address[];
  unregistered: Address[];
}> {
  if (!WEB_DEPLOYMENT.factory || !WEB_DEPLOYMENT.personaByAgent) {
    return { registered: [], unregistered: [] };
  }
  return cached(`agent-registry:${WEB_DEPLOYMENT.factory}`, async () => {
    const client = getPublicClient();
    const wallets = Array.from(WEB_DEPLOYMENT.personaByAgent!.keys());
    const results = await Promise.all(
      wallets.map((addr) =>
        client.readContract({
          address: WEB_DEPLOYMENT.factory!,
          abi: PropMarketHookFactoryABI,
          functionName: "registeredAgents",
          args: [addr],
        }),
      ),
    );
    const registered: Address[] = [];
    const unregistered: Address[] = [];
    wallets.forEach((addr, i) => {
      if (results[i]) registered.push(addr);
      else unregistered.push(addr);
    });
    return { registered, unregistered };
  });
}

export async function getUsdt0Balance(account: Address | null): Promise<bigint | null> {
  if (!account) return null;
  const client = getPublicClient();
  const balance = await client.readContract({
    address: WEB_DEPLOYMENT.usdt0,
    abi: IUSDT0ABI,
    functionName: "balanceOf",
    args: [account],
  });
  return balance as bigint;
}
