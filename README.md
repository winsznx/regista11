# Regista 11

> Live football prop markets, made by AI agents. Built for the 2026
> tournament on X Layer.

[![X Cup](https://img.shields.io/badge/X_Cup-OKX_×_X_Layer-ec652b?style=flat-square)](https://www.okx.com/xlayer)
[![Live](https://img.shields.io/badge/status-LIVE_on_X_Layer-44b48b?style=flat-square)](https://regista11.xyz/status)

[![X Layer](https://img.shields.io/badge/chain-X_Layer_196-111a4a?style=flat-square)](https://www.oklink.com/x-layer)
[![USDT0](https://img.shields.io/badge/settle-USDT0-26a17b?style=flat-square)](https://docs.usdt0.to)
[![Uniswap v4 Hook](https://img.shields.io/badge/v4_hook-PropMarketHook-ff007a?style=flat-square)](https://docs.uniswap.org/contracts/v4/overview)
[![EIP-3009](https://img.shields.io/badge/stake-EIP--3009_gasless-44b48b?style=flat-square)](https://eips.ethereum.org/EIPS/eip-3009)

## What it is

Eleven autonomous AI personas track every event in a live football match —
possession swings, shot patterns, foul intensity — and open binary
prediction markets in real time on **X Layer** mainnet. Each market is a
custom **Uniswap v4 hook** that settles in **USDT0**. Users stake gaslessly
with a single EIP-712 signature in their wallet.

This is an **X Cup submission**, built for the OKX X Layer hackathon
and positioned for the **2026 tournament** (Jun 11 – Jul 9). Match-day-
ready on every X Layer block.

The protocol uses a custom Uniswap v4 hook (`PropMarketHook` — the same
caliber of work the Hook the Future competition is looking for, shipped
here as core protocol infrastructure) and cross-chain WC outcome
resolution from Flap's `WorldCupResolver` on BNB Chain. Hook + Flap are
tech credentials underneath the X Cup submission, not separate
submissions.

## See it live

- dApp: [regista11.xyz](https://regista11.xyz)
- Markets: [regista11.xyz/markets](https://regista11.xyz/markets)
- The Eleven: [regista11.xyz/agents](https://regista11.xyz/agents)
- System status (judge-verifiable): [regista11.xyz/status](https://regista11.xyz/status)
- Demo video (90s): [x.com/regista11_ · video](https://x.com/regista11_/status/2060150599153246237?s=46)
- X thread: [x.com/regista11_ · submission thread](https://x.com/regista11_/status/2060149005087093120?s=46)

## The Eleven

Eleven personas, all active. Each opens 2–4 markets per match within its
tactical window. Templates reuse a shared library of 7 propositions —
variety comes from WHEN each persona fires and WHICH team it focuses on.

| # | Persona | Role | Templates |
|---|---|---|---|
| 01 | Il Regista | Deep-lying playmaker | Clean sheet · Possession · Corners |
| 02 | Il Trequartista | Creative attacker | Next goal · Shots on target · Corners |
| 03 | Il Mediano | Defensive enforcer | Fouls · Yellow cards |
| 04 | Il Falso Nove | False nine | Shots on target · Possession · Next goal |
| 05 | Il Libero | Sweeper | Clean sheet · Corners |
| 06 | L'Ala | Wing-back | Corners · Shots on target |
| 07 | Il Bomber | Pure striker | Next goal · Shots on target |
| 08 | Il Capitano | Captain · Left flank | Yellow cards · Fouls |
| 09 | Il Numero Dieci | Number 10 | Possession · Next goal · Shots on target |
| 10 | Il Catenaccio | Defensive anchor | Clean sheet · Yellow cards |
| 11 | L'Ultimo | Last line (GK) | Clean sheet |

## Architecture

```
User
  │
  │ EIP-3009 authorization (single gasless wallet signature)
  ▼
x402 facilitator  (/api/facilitator/stake)
  │
  │ relayer.writeContract(market.stake)
  ▼
PropMarketHook   (Uniswap v4 hook · X Layer chain 196)
  │
  │ USDT0.transferWithAuthorization
  ▼
USDT0            (Tether's omnichain stable via LayerZero OFT)
  │
  │ on chain
  ▼
X Layer mainnet  (chain 196 · OKX zkEVM L2)
                              ⇄ cross-chain authorized resolution
                                  ▼
                                Flap WorldCupResolver (BNB Chain)
```

## Smart contracts — PropMarketHook

`PropMarketHook` is a custom Uniswap v4 hook implementing commit-reveal
binary prediction markets. The hook overrides `beforeInitialize`,
`beforeAddLiquidity`, `beforeRemoveLiquidity`, `beforeSwap`, and
`afterSwap` to bind the v4 pool lifecycle to a prediction market's
commit → stake → reveal → resolve flow. LP is rejected by construction
(`PropMarketHook__LiquidityNotAllowed`) — markets are stake aggregators,
not AMM venues.

**Commit-reveal** is the anti-frontrun primitive. Each agent commits
`keccak256(revealedParams || salt || agent)` on creation; `revealedParams`
is only published after staking closes.

**Dual-pool stake aggregation** tracks OVER and UNDER pools separately.
On resolution the winning pool is paid out proportionally from the
losing pool; refund path returns stakes if either pool is empty.

**Salt-mined CREATE2 deployment.** The factory mines a salt that
produces a hook address with the `0x2A80` permission bitmap — verified
by `HookMiner` in ~16K iterations / 749 ms on commodity hardware.

| Contract | Address | Notes |
|---|---|---|
| `PropMarketHookFactory` | `{{FACTORY_ADDR}}` | Salt-mined CREATE2 |
| First market (live recording) | `{{FIRST_MARKET_ADDR}}` | Il Regista · clean sheet 30' |

**67/67 tests · 100% line/branch/function coverage** on PropMarketHook.sol.

## Agent runtime

Eleven TypeScript persona processes share one `TickLoop` per persona,
poll API-Football, and act on `MatchStateDiff` deltas. Each persona's
wallet is BIP-44 derived (`m/44'/60'/0'/0/{index}` for index 0…10) from
a single master mnemonic. Wallets register on-chain via
`PropMarketHookFactory.registerAgent(addr)` post-deploy.

The whole runtime is one container — `pnpm --filter @regista11/agent
agent:start <fixtureId> --persona=all` spawns all 11 personas in
parallel within one process. Deployed to Railway with a `/health`
endpoint the web's `/status` page polls every 10s.

**229/229 tests passing.** Deterministic (no `Math.random`), restart-
safe (pending-promise tracker in `TickLoop` cleans up on SIGTERM).

## USDT0 + EIP-3009

USDT0 is Tether's omnichain stable on X Layer, deployed by Everdawn Labs
as a LayerZero OFT v2 token, 1:1 backed by locked USDT on Ethereum.

- Contract: [`0x779Ded0c9e1022225f8E0630b35a9b54bE713736`](https://www.oklink.com/x-layer/address/0x779Ded0c9e1022225f8E0630b35a9b54bE713736)
- EIP-712 domain name: **`USD₮0`** (U+20AE TUGRIK SIGN — locked in code
  via `codePointAt(3) === 0x20ae` test assertion)
- Decimals: 6

EIP-3009 `transferWithAuthorization` enables gasless stakes. The user
signs a single typed-data payload in their wallet; our in-app
facilitator at `/api/facilitator/stake` validates + relays the
authorization on-chain. The relayer pays gas in OKB; the user pays
nothing.

**First documented dapp on X Layer using EIP-3009 gasless flow per
research, May 2026.**

## Cross-chain resolution via Flap

Flap operates `WorldCupResolver` on BNB Chain at
[`0x134C6b9562E226096947e018ddEe4804c9146921`](https://bscscan.com/address/0x134C6b9562E226096947e018ddEe4804c9146921).
For markets scoped to 2026 tournament fixtures (Jun 11 – Jul 9 2026),
`PropMarketHook.resolve(outcome)` is gated to accept calls from Flap's
resolver — single trust anchor for WC outcomes. Pre-WC markets use
an interim admin resolver, transparently labeled in the deployment
artifact.

## Farcaster frame

Every live market is also a Farcaster Frame v2 surface. Share
`regista11.xyz/frame/<marketAddress>` in a cast and any Warpcast user
can stake in 3 taps (amount → side → wallet sign). Signed POST flows
land at the protocol's x402 facilitator and settle on X Layer.

## Repo structure

```
regista11/
├── packages/
│   ├── contracts/          Foundry · Solidity 0.8.26 · 67 tests · 100% coverage
│   ├── agent/              TypeScript · 229 tests · 11 personas + 7 templates · Dockerised
│   ├── web/                Next.js 15 · 174 tests · dApp + landing + frame + /status
│   └── x402-facilitator/   Day 0 verified — settlement infrastructure
└── README.md               (this file)
```

The facilitator is also published standalone as
[`@regista11/x402-facilitator@0.1.0`](https://www.npmjs.com/package/@regista11/x402-facilitator)
on npm — any team running an x402-style settlement layer on X Layer can
install it directly:

```bash
pnpm add @regista11/x402-facilitator
```

## Running locally

```bash
pnpm install
pnpm --filter @regista11/contracts test     # forge tests
pnpm --filter @regista11/agent test         # vitest
pnpm --filter @regista11/web test           # vitest
pnpm --filter @regista11/web dev            # http://localhost:3000
```

Env vars (see `packages/web/.env.example`):

- `NEXT_PUBLIC_WC_PROJECT_ID` — WalletConnect cloud project id
- `NEXT_PUBLIC_APP_URL` — public origin (`https://regista11.xyz` in prod)
- `RELAYER_PRIVATE_KEY` — **server-only** relayer wallet for the
  facilitator. Funded with OKB for X Layer gas.
- `PUBLIC_AGENT_URL` — the Railway agent service URL the web's
  `/status` page polls

Spawn all 11 personas against a live match (one process):

```bash
pnpm --filter @regista11/agent agent:start <fixtureId> --persona=all
```

The agent + web both ship as Dockerised services pinned to
`numReplicas: 1` (single instance, for relayer nonce safety).

## On-chain proof

**Day 0 USDT0 EIP-3009 settlement** (May 22 2026 · pre-protocol smoke):

```
0xeff5521a14f976727d77f3c9378e9b1ae5dc19d6b7b91f2088ddaa2e0ec72553
```

→ [OKLink](https://www.oklink.com/x-layer/tx/0xeff5521a14f976727d77f3c9378e9b1ae5dc19d6b7b91f2088ddaa2e0ec72553)

**Live demo recording** (May 28 2026):

- First market on chain: {{FIRST_MARKET_TX}}
- First stake placed:    {{FIRST_STAKE_TX}}
- Resolution:            {{RESOLVE_TX}}

## License

MIT — see [LICENSE](LICENSE).

## Built for

- **OKX X Cup · X Layer track** — `@XLayerOfficial` · `#BuildX`
