# REGISTA 11 — Master PRD

**Version** 1.0
**Status** Locked. Day 0 PASSED. Phase E delivered. Phase F (build) gated on Tim's confirmation.
**Last revised** 2026-05-22
**Owner** Tim (@winsznx)
**Domain** regista11.xyz
**Repo** github.com/winsznx/regista11
**Hackathons** OKX X Cup (May 19–28, $5K 1st) + Hook the Future (May 22–28, Uniswap × Flap)
**Submission deadline** 2026-05-28 23:59 UTC

---

## 0. Status & changelog

| Date | Phase | Outcome |
|---|---|---|
| 2026-05-22 AM | A — Recon | Sponsor decoder, winners autopsy, AI-judge decode complete |
| 2026-05-22 AM | B — Ideation | Path A locked: agent-as-market-maker, in-play binary props |
| 2026-05-22 AM | C — Defensibility | 30-sec test passed, brand "Regista 11" + domain locked |
| 2026-05-22 PM | Day 0 gate | All 10 checks + KILL CHECK PASS. Settlement tx `0xeff5521a…2553` |
| 2026-05-22 PM | D — Screenplay | Demo video beat-list locked. Primary demo target: UEFA Conference League Final, May 27, 19:00 UTC |
| 2026-05-22 PM | E — Master PRD | This document |
| → next | F — Sequenced build | Day 1 kickoff after Tim confirms PRD |

---

## 1. Executive summary

Regista 11 is a permissionless on-chain prop-market protocol on X Layer (chain 196). Eleven AI agents — each a distinct trading persona drawn from Italian football's tactical archetypes — autonomously create binary prediction markets during live football matches. Market parameters are cryptographically committed before the agent observes match state, preventing self-dealing. Fans stake gasless in USDT0 via the first permissionless x402 facilitator built for X Layer. Settlement runs through a custom Uniswap v4 Hook (`PropMarketHook`). Every market, stake, reveal, resolution, and payout is on X Layer mainnet — no mocks, no testnet, no demo data.

The product enters two parallel hackathons with one codebase. **X Cup** sees a World-Cup-themed AI-agent prediction-market product; **Hook the Future** sees a novel Uniswap v4 Hook combined with the first x402 facilitator for X Layer (composable public good). The dual-submission strategy plays cleanly because the artifacts genuinely satisfy both rubrics — no positioning gymnastics required.

The fundamental thesis: live in-play prediction is a $28.4B GGR market growing 11.3% annually, but every crypto attempt has built around pre-match volume (Polymarket $963M on the World Cup, all pre-match). The unbuilt layer is **live in-play, AI-mediated, gasless** — and X Layer + USDT0 + x402 + v4 Hooks is the first stack where it composes naturally. We're not extending Polymarket. We're building what Polymarket can't.

---

## 2. Product positioning

### 2.1 X Cup framing

> "Eleven AI agents make live football prop markets. Live now on X Layer mainnet."

**Lead claim:** First in-play prediction market protocol on X Layer mainnet, purpose-built for the 2026 World Cup.

**Rubric hits:**
- **Innovation** — agent-as-market-maker is a new primitive; commit-reveal is novel anti-self-dealing
- **Market potential** — $28.4B live betting GGR, 75% 90-day churn, agent layer as the moat
- **Completion** — real markets, real stakes, real resolutions, OKLink-verifiable end-to-end
- **WC narrative** — the 11 agents = the starting eleven; matches map 1:1 to product lifecycle

### 2.2 Hook the Future framing

> "Novel Uniswap v4 Hook for binary prediction markets, paired with the first permissionless x402 facilitator for X Layer."

**Lead claim:** Two composable open-source primitives shipped together — neither has been combined before on any chain.

**Rubric hits:**
- **Innovation** — v4 Hook + x402 is a new combination (verified via Grok: zero prior implementations)
- **Market potential** — every prop market is a v4 Pool with native LP routing; post-Cup roadmap extends to weekly Champions League, Premier League, NFL/NBA seasons
- **Completion** — hook is deployed, audited via tests, gas-profiled
- **Sustainable activity** — agents tick every minute of every match, generating continuous market churn

### 2.3 Audience

| Persona | Primary need | How Regista 11 serves |
|---|---|---|
| Football fan | In-play action without sportsbook friction | One-tap Farcaster stake, $0.50–$50 USDT0 range |
| Liquidity provider | Yield on stablecoin during live events | Each pool is v4-native; LPs earn fees from agent + fan flow |
| Agent operator | Run their own persona on Regista 11 rails | Open agent SDK, anyone can register an agent (post-hack) |
| Developer | x402 facilitator as a library | npm package + hosted endpoint, MIT license |

### 2.4 Key claims (locked, must appear in every artifact)

1. **First permissionless x402 facilitator for X Layer** (verified gap via Grok)
2. **First in-play prediction market protocol on X Layer mainnet**
3. **Eleven distinct AI agents with cryptographic anti-self-dealing**
4. **Live during UEFA Conference League Final, May 27 2026** (demo evidence)

---

## 3. System architecture

### 3.1 High-level flow

```
┌─────────────────────────┐
│  API-Football live feed │
└────────────┬────────────┘
             │ match state every 60s
             ▼
┌─────────────────────────┐         ┌──────────────────────┐
│  Agent runtime (Node)   │────────▶│  Onchain OS skills   │
│  11 personas, 1 process │         │  (OKX skill chain)   │
└────────────┬────────────┘         └──────────────────────┘
             │ commitHash
             ▼
┌─────────────────────────┐
│  PropMarketHookFactory  │  ── createMarket() ──▶  PropMarketHook (per-pool)
│  (X Layer mainnet)      │
└─────────────────────────┘                              ▲
                                                         │
┌─────────────────────────┐                              │
│  Fan (Farcaster frame)  │── EIP-3009 sig ──┐           │
└─────────────────────────┘                  ▼           │
                                ┌─────────────────────┐  │
                                │ XLayerFacilitator-  │──┘ Hook.stake()
                                │ Client (x402)       │
                                └─────────────────────┘
                                       │
                                       ▼
                                ┌────────────────┐
                                │  USDT0 ERC-20  │
                                │  (X Layer)     │
                                └────────────────┘
```

### 3.2 Components

| ID | Component | Status | Location | Purpose |
|---|---|---|---|---|
| C-01 | Match feed | External | api-football.com | Source of live match state |
| C-02 | Agent runtime | To build | `packages/agent/` | Per-tick decision loop, 11 personas |
| C-03 | Onchain OS skills | External | OKX SDK | Tx submission, wallet, dex signal |
| C-04 | PropMarketHookFactory | To build | `packages/contracts/src/` | Deploys per-match hooks |
| C-05 | PropMarketHook | To build | `packages/contracts/src/` | v4 hook, commit-reveal, stake, claim |
| C-06 | USDT0 | Deployed | `0x779D…3736` | Settlement token, EIP-3009 |
| C-07 | XLayerFacilitatorClient | **DONE Day 0** | `packages/x402-facilitator/` | x402 settlement on X Layer |
| C-08 | Indexer (Goldsky) | To configure | external subgraph | Read market state for frontend |
| C-09 | Frontend (Next.js 15) | To build | `packages/web/` | Landing + dashboard + frame |
| C-10 | Farcaster frame | To build | `packages/web/src/app/api/frame/` | One-tap stake from social |
| C-11 | Resolver (admin) | To build | `packages/contracts/src/` | Resolution authority for Day 5 GATE |
| C-12 | Resolver (Flap UMA, stretch) | Optional | bridge via Hyperlane | Decentralized resolution post-hack |

### 3.3 Network topology

- **X Layer mainnet** (chain 196, OP-Stack) — primary; all contracts, all settlement
- **BSC** (chain 56) — read-only access to Flap WorldCupResolver + AI Oracle (stretch goal)
- **No testnet anywhere** — per project rule

### 3.4 External dependencies

| Dep | Version | Purpose |
|---|---|---|
| `@uniswap/v4-core` | 1.0.2 | PoolManager, IHooks |
| `@uniswap/v4-periphery` | 1.0.3 | BaseHook |
| `@openzeppelin/uniswap-hooks` | 1.1.1 | Hardened hook base |
| `@okxweb3/x402-core` | 0.1.0 | Facilitator interface, types |
| `@okxweb3/x402-evm` | 0.1.0 | Client signing helpers |
| `@okxweb3/x402-express` | 0.1.0 | Server middleware |
| `viem` | ^2.39.3 | All EVM I/O |
| `@neynar/nodejs-sdk` | latest | Farcaster frame |
| `next` | 15.x | Frontend |
| `react` | 19.x | Frontend |
| `@tanstack/react-query` | latest | Server state |
| `motion` | 12.x | Frontend animations |
| `lucide-react` | latest | Icons |

---

## 4. Smart contracts

### 4.1 PropMarketHook (per-market v4 hook)

Inherits `OpenZeppelin BaseHook` from `@openzeppelin/uniswap-hooks@1.1.1`. Each deployed instance is bound to ONE market (one prop, one match, one agent). The hook is mined at a CREATE2 address whose permission bits match the bitmap `0x2A80`.

**Permission bitmap (0x2A80):**
- bit 13 → BEFORE_INITIALIZE
- bit 11 → BEFORE_ADD_LIQUIDITY
- bit 9 → BEFORE_REMOVE_LIQUIDITY
- bit 7 → BEFORE_SWAP

**Storage:**

```solidity
struct Market {
    bytes32 commitHash;          // keccak256(params || salt || agentId)
    bytes32 revealedParamsHash;  // = commitHash once revealed
    bytes   revealedParams;      // ABI-encoded (matchId, proposition, sideA, sideB, deadline)
    uint64  commitBlock;
    uint64  revealDeadline;      // commitBlock + REVEAL_WINDOW
    uint64  marketDeadline;      // when staking closes
    uint64  resolveDeadline;     // hard cap; refund unlocks after this
    address agent;
    uint256 totalYes;
    uint256 totalNo;
    uint8   outcome;             // 0=unresolved, 1=yes, 2=no, 3=refunded
    bool    revealed;
    bool    resolved;
}

struct Stake {
    uint256 yes;
    uint256 no;
    bool    claimed;
}

Market public market;                                  // single market per hook
mapping(address => Stake) public stakes;
address public immutable factory;                      // PropMarketHookFactory
address public immutable resolver;                     // admin (Day 5) or bridge address (stretch)
address public immutable usdt0;                        // 0x779D…3736
uint64  public constant REVEAL_WINDOW = 180;           // 3 minutes
```

**External functions:**

```solidity
// Called once by factory at deploy
function initialize(
    bytes32 commitHash,
    address agent,
    uint64  marketDeadline,
    uint64  resolveDeadline
) external onlyFactory;

// Called by agent after REVEAL_WINDOW with the original params + salt
function reveal(bytes calldata params, bytes32 salt) external;

// Called by user (or facilitator on user's behalf) to stake
// signature is EIP-3009 TransferWithAuthorization on USDT0
function stake(
    uint8 side,            // 1=yes, 2=no
    uint256 amount,
    uint256 validAfter,
    uint256 validBefore,
    bytes32 nonce,
    uint8 v, bytes32 r, bytes32 s
) external;

// Resolver calls this with the binary outcome
function resolve(uint8 outcome) external onlyResolver;

// User claims their share after resolution
function claim() external;

// Refund path if reveal didn't happen or resolver missed deadline
function refund() external;
```

**v4 lifecycle hooks** (all enforce market state, see §4.4 invariants):

```solidity
function _beforeInitialize(...) internal override returns (bytes4);
function _beforeSwap(...) internal override returns (bytes4, BeforeSwapDelta, uint24);
function _beforeAddLiquidity(...) internal override returns (bytes4);
function _beforeRemoveLiquidity(...) internal override returns (bytes4);
```

The hook intentionally **rejects all external liquidity adds/removes** during the active market window — liquidity is the staked USDT0, not LP-provided. The pool exists as the canonical address for state; v4 isn't being used for swapping but for the lifecycle anchoring + the architectural composability story (any future caller can read a Pool's address and the hook's state in one call).

### 4.2 PropMarketHookFactory

Single global factory on X Layer mainnet. Deployed once. Deploys a new `PropMarketHook` per (matchId, agentId, propositionId) tuple via CREATE2 with deterministic salt.

```solidity
contract PropMarketHookFactory {
    IPoolManager public immutable poolManager;
    address public immutable usdt0;
    address public immutable resolver;

    mapping(bytes32 => address) public marketIdToHook;
    mapping(address => bool) public registeredAgents;
    address public owner;

    event MarketCreated(
        bytes32 indexed marketId,
        address indexed agent,
        address hook,
        PoolId poolId,
        bytes32 commitHash,
        uint64 deadline
    );

    function registerAgent(address agent) external onlyOwner;

    function createMarket(
        bytes32 matchId,
        bytes32 propositionId,
        bytes32 commitHash,
        uint64  marketDeadline,
        uint64  resolveDeadline
    ) external onlyRegisteredAgent returns (address hook, PoolId poolId);
}
```

Salt construction:
```
salt = keccak256(matchId, propositionId, msg.sender, commitHash)
```
Sub-second mining was validated in Day 0 (#10) with hash `0x9931ad9c…fda9a8`. The factory uses the canonical CREATE2 deployer (`0x4e59…956C`) under the hood.

### 4.3 Lifecycle — state diagram

```
                  createMarket()
                      │
                      ▼
                 ┌──────────┐
                 │ COMMITTED │ ── reveal window expires without reveal() ──┐
                 └──────────┘                                              │
                      │ reveal()                                           │
                      ▼                                                    │
                  ┌─────────┐                                              │
                  │ REVEALED │ ── marketDeadline reached, no stake ──┐    │
                  └─────────┘                                         │    │
                      │ stake() (one or more)                         │    │
                      ▼                                               │    │
                   ┌──────┐                                           │    │
                   │ ACTIVE│ ── marketDeadline reached ──┐            │    │
                   └──────┘                              │            │    │
                                                         ▼            ▼    ▼
                                                    ┌─────────┐ ┌─────────────┐
                                                    │ CLOSED  │ │  REFUNDED   │
                                                    └─────────┘ └─────────────┘
                                                         │            ▲
                                                         │ resolve()  │ resolveDeadline missed
                                                         ▼            │
                                                    ┌──────────┐      │
                                                    │ RESOLVED │ ─────┘
                                                    └──────────┘
                                                         │ claim() per user
                                                         ▼
                                                    ┌──────────┐
                                                    │ SETTLED  │ (per user)
                                                    └──────────┘
```

### 4.4 Invariants (must hold at all times)

1. `stakes[user].yes + stakes[user].no ≤ totalYes + totalNo` for that user
2. Sum of all `(yes + no)` stakes == `USDT0.balanceOf(hookAddress)` minus already-claimed amount
3. `revealed == false` → `_beforeSwap` reverts
4. `resolved == false` → `claim()` reverts
5. `block.timestamp > resolveDeadline && !resolved` → `refund()` succeeds for any user
6. `keccak256(revealedParams || salt || agent) == commitHash` is the only valid reveal

### 4.5 Events

```solidity
event MarketInitialized(bytes32 commitHash, address agent, uint64 deadline);
event ParametersRevealed(bytes revealedParams, bytes32 salt, uint64 revealedAt);
event StakeRecorded(address indexed user, uint8 side, uint256 amount, bytes32 txRef);
event MarketResolved(uint8 outcome, address resolver, uint64 resolvedAt);
event StakeClaimed(address indexed user, uint256 amount);
event MarketRefunded(uint64 refundedAt);
```

Every state transition emits at least one event with structured fields (per security-conscious README rule).

### 4.6 Error surface

```solidity
error NotFactory();
error NotResolver();
error NotRegisteredAgent();
error AlreadyInitialized();
error NotInState(uint8 expected, uint8 actual);
error CommitMismatch();
error RevealWindowOpen();
error RevealWindowExpired();
error MarketClosed();
error AlreadyResolved();
error InvalidOutcome();
error NothingToClaim();
error AlreadyClaimed();
error ResolveDeadlineNotReached();
error UnauthorizedSignature();
```

### 4.7 Gas profile targets (X Layer is cheap; targets are still meaningful for UX)

| Operation | Target | Hard cap |
|---|---|---|
| `createMarket` | ~250k | 400k |
| `reveal` | ~80k | 120k |
| `stake` (with EIP-3009) | ~150k | 220k |
| `resolve` | ~60k | 90k |
| `claim` | ~70k | 100k |

### 4.8 Test plan

`packages/contracts/test/`:
- `PropMarketHook.t.sol` — happy path: create → reveal → stake (both sides) → resolve → claim
- `PropMarketHook.revealRefund.t.sol` — reveal missed → refund unlocks
- `PropMarketHook.resolveRefund.t.sol` — resolve missed → refund unlocks
- `PropMarketHook.invariants.t.sol` — Foundry invariant testing for §4.4
- `PropMarketHook.eip3009.t.sol` — signature recovery, replay, expired auth
- `PropMarketHookFactory.t.sol` — CREATE2 determinism, agent registration, double-create

Coverage target: ≥ 95% line, ≥ 90% branch.

---

## 5. Agent runtime

### 5.1 The Eleven — named personas

Each agent is a configuration profile on top of one shared runtime. Names draw from Italian football's tactical archetypes — distinctive, on-brand, no IP risk.

| # | Agent | Role | Specialization | Window | Max markets/match |
|---|---|---|---|---|---|
| 01 | **Il Regista** | Deep playmaker | Long-window flow markets (full-match) | 0'–90' | 2 |
| 02 | **Il Trequartista** | Attacking mid | Final-third props (shots, key passes, attacks) | 0'–90' | 4 |
| 03 | **Il Mediano** | Defensive mid | Defensive props (tackles, fouls, interceptions) | 0'–90' | 4 |
| 04 | **Il Falso Nove** | False nine | Contrarian inversions (takes opposite of leaning side) | 15'–75' | 3 |
| 05 | **Il Libero** | Sweeper | Overlooked micro-markets (yellow cards, throw-ins) | 0'–90' | 5 |
| 06 | **L'Ala** | Winger | Flank-action props (left vs right side activity) | 0'–90' | 3 |
| 07 | **Il Bomber** | Striker | Pure goal markets (next goal, total goals) | 0'–80' | 4 |
| 08 | **Il Capitano** | Captain | High-leverage moments only (post-VAR, post-goal, ≤5' to whistle) | trigger-based | 3 |
| 09 | **Il Numero Dieci** | Number 10 | Creative wildcards (assists, dribbles past, chances created) | 30'–90' | 3 |
| 10 | **Il Catenaccio** | Defensive system | Low-scoring scenarios (clean sheet remaining, 0-0 next 15') | 0'–80' | 3 |
| 11 | **L'Ultimo** | Stoppage-time specialist | Second-half + extra-time only | 45'+ | 4 |

Total bound: **38 markets per 90-minute match** (worst case if every agent maxes out — they won't).

### 5.2 Shared runtime

`packages/agent/src/`:
- `core/` — base agent class, tick loop, persistence
- `personas/` — one file per persona with config (window, market-types, conviction threshold)
- `skills/` — wrappers around Onchain OS calls
- `matches/` — match state tracker, API-Football client
- `commit/` — commit-reveal helpers
- `propositions/` — market template library (see §5.4)

One Node process runs all 11 agents in parallel as workers. Each agent is a small async loop:

```ts
while (matchActive) {
  const state = await matchFeed.tick();              // 60s cadence
  const candidates = await persona.evaluate(state);  // returns 0..N proposed markets
  for (const candidate of candidates) {
    if (await persona.shouldOpen(candidate, state)) {
      const { commitHash, salt } = commit(candidate);
      const txHash = await skills.createMarket(commitHash, candidate.deadline);
      pendingReveals.push({ candidate, salt, revealAt: now() + 180 });
    }
  }
  for (const pending of dueReveals()) {
    await skills.revealMarket(pending.candidate, pending.salt);
  }
}
```

### 5.3 Skill chain (Onchain OS)

Each `skills.createMarket` call orchestrates the OKX skill stack:

1. `okx-onchain-gateway` — read current chain state, gas price, factory nonce
2. `okx-security` — verify factory address, agent registration status
3. `okx-agentic-wallet` — load agent's hot wallet (derived from agent seed + index)
4. Build createMarket calldata via viem `encodeFunctionData`
5. `okx-agentic-wallet.signAndSend` — submit tx
6. Wait for receipt (skill abstracts retries)
7. Return tx hash + market address

This explicit skill enumeration is critical for X Cup judging — every agent action shows the OKX stack working end-to-end (high lexical density in submission narrative).

### 5.4 Proposition library

`packages/agent/src/propositions/` — typed market templates. Each template has:
- `id` (e.g., `NEXT_CORNER_SIDE_5MIN`)
- `requiredState` (e.g., `match.minute >= 5 && match.minute <= 85`)
- `windowSeconds` (e.g., 300 = 5 min from creation)
- `sides` (binary labels: e.g., `["LEFT", "RIGHT"]`)
- `resolve(matchState)` returning `1 | 2 | null`

Templates (initial set, expandable):
- `NEXT_CORNER_SIDE_5MIN` — Left vs right flank
- `NEXT_GOAL_HOME_OR_AWAY_NEXT_15`
- `NEXT_CARD_COLOR_5MIN` — Yellow vs red, given a card is shown
- `SHOTS_ON_TARGET_OVER_X_NEXT_10MIN`
- `POSSESSION_PCT_HOME_OVER_55_NEXT_5MIN`
- `FOUL_IN_FINAL_THIRD_NEXT_3MIN`
- `SUBSTITUTION_BEFORE_75MIN`
- `EXTRA_TIME_GOAL_BEFORE_94MIN`
- `THROW_IN_VS_GOAL_KICK_NEXT_BREAK`
- `CLEAN_SHEET_REMAINING_NEXT_15`

### 5.5 Commit-reveal

`packages/agent/src/commit/`:

```ts
function commitParams(params: PropositionParams, agentId: number): {
  commitHash: Hex;
  salt: Hex;
} {
  const salt = randomBytes32();
  const encoded = encodeAbiParameters(
    PROPOSITION_ABI,
    [params]
  );
  const agent = AGENT_ADDRESSES[agentId];
  const commitHash = keccak256(concat([encoded, salt, agent]));
  return { commitHash, salt };
}
```

The salt is persisted locally per market until reveal. Reveal happens via:

```ts
await contract.write.reveal([encoded, salt]);
```

The hook verifies `keccak256(encoded || salt || agent) == storedCommitHash` and only then unlocks staking. If reveal doesn't happen within `REVEAL_WINDOW` (3 min), refund path opens.

### 5.6 Wallet management

- 11 agent hot wallets, derived from a single master seed (BIP-44 path `m/44'/60'/0'/0/{agentIndex}`)
- Each wallet pre-funded with ~0.05 OKB for gas (~800 createMarket+reveal pairs each, ample for the demo window)
- Master seed in env var, **never logged**
- Per-agent wallet is registered with the factory via `registerAgent(address)` (one-time, by factory owner)

### 5.7 Failure modes & retries

| Failure | Detection | Action |
|---|---|---|
| RPC timeout | viem timeout | Retry 3× with 500ms/2s/5s backoff, then skip tick |
| Insufficient gas | `out of gas` revert | Top up from facilitator hot wallet, retry |
| Nonce collision (concurrent ticks) | `nonce too low` | Refresh nonce, retry |
| Match feed unavailable | API-Football 5xx | Skip tick, next-tick attempt |
| Reveal salt lost (process restart) | Salt not in persistence | Mark market for auto-refund |
| Resolve oracle disagreement | Two reads diverge | Block resolve, surface to admin |

### 5.8 Persistence

SQLite via Prisma at `packages/agent/data/agent.db`. Tables:
- `markets` — full state of every market created (in-flight + finished)
- `commits` — (marketId, params, salt, agentId, commitHash)
- `ticks` — every match-state read, for post-mortem
- `txs` — every submitted transaction with hash + status

The DB is read by the frontend's API routes for non-real-time data (the indexer handles real-time).

---

## 6. x402 facilitator (PUBLIC GOOD)

Already built and tested end-to-end during Day 0. The full report is at `packages/x402-facilitator/REPORT.md` (settlement tx `0xeff5521a14f976727d77f3c9378e9b1ae5dc19d6b7b91f2088ddaa2e0ec72553`).

### 6.1 What it is

`@regista11/x402-facilitator-xlayer` — a TypeScript implementation of `FacilitatorClient` from `@okxweb3/x402-core`, settling EIP-3009 `TransferWithAuthorization` against USDT0 directly on X Layer mainnet. **No OKX facilitator URL dependency.** No SDK fork.

This closes a real gap: there are zero permissionless x402 facilitators on X Layer prior to this. The OKX SDK ships a default facilitator hosted by OKX, which is geo-restricted and not open-sourced. Our implementation is MIT, npm-installable, and the hosted endpoint is available at `https://facilitator.regista11.xyz` (to be deployed Day 1).

### 6.2 API surface

| Method | Purpose |
|---|---|
| `verify(payload, requirements)` | Signature recovery + balance + nonce + time-window checks |
| `settle(payload, requirements)` | Submit `transferWithAuthorization` on USDT0, cache (from,nonce) → txHash |
| `getSupported()` | Return scheme/network/extension capability JSON |
| `getSettleStatus(txHash)` | Receipt status for async clients |

### 6.3 Open-source publication plan

- **Repo path:** `github.com/winsznx/regista11/packages/x402-facilitator/`
- **npm:** `@winsznx/x402-facilitator-xlayer` (publish Day 1)
- **Hosted endpoint:** `facilitator.regista11.xyz` (Railway, Day 1)
- **License:** MIT
- **README:** dedicated, separate from main repo README — explains the gap, the implementation, how to self-host vs use hosted

This is the Hook the Future "public good" angle. The submission narrative leads with this for that hackathon.

### 6.4 Operational

- Hot wallet for the facilitator: separate from the agent wallets (single-purpose, easy to monitor)
- Auto top-up logic: if balance < 0.01 OKB, alert (manual top-up acceptable for hack window)
- Idempotency cache: in-process Map<(from, nonce), txHash>, 10-min TTL — survives process restart? **No (acceptable for hack; production would use Redis)**

---

## 7. Oracle integration

### 7.1 Day 5 GATE: admin-resolver (the default)

For the Day 5 GATE and demo, `resolver` is a single EOA controlled by Tim. After each market closes:

1. Admin reads the actual match outcome from API-Football
2. Admin calls `hook.resolve(outcome)` from the resolver wallet
3. Event emitted, claim path unlocks

This is acceptable for the hack because:
- Every resolve is on-chain transparent (the resolver address is public)
- The README documents the centralization clearly
- The proposed Day 6 stretch upgrades this to UMA via Flap

### 7.2 Day 6 stretch: Flap WorldCupResolver bridge

If Day 5 GATE passes early, Day 6 attempts:
- Read `Flap.WorldCupResolver.getOutcome(matchId)` from BSC
- Bridge the outcome to X Layer via Hyperlane (or LayerZero if simpler)
- `resolver` becomes the bridge endpoint instead of an EOA

This is **not on the critical path**. Day 5 GATE PASS with admin-resolver is acceptable for both hackathon submissions; Flap is bonus.

### 7.3 Outcome verification trail

Regardless of which path is used, every resolution emits an event with:
- The outcome (1 or 2)
- A `bytes32 outcomeProof` — for admin path, this is `keccak256(apiResponse)`; for Flap path, the cross-chain message hash
- A timestamp

The frontend surfaces the proof on each resolved market for transparency.

---

## 8. Frontend

### 8.1 Design system

**Reference:** column.com — "architectural blueprint on white marble" — corporate-authority + digital-precision aesthetic. The tokens are pulled directly from the Refero extraction of Column's design system and applied without modification.

**Conceptual mapping:** Column's "blueprint" metaphor maps perfectly to the tactical-board concept. A football tactical diagram IS a blueprint. The Deep Plum + Action Orange become Regista 11's brand axis on the same luminous-white surface.

#### 8.1.1 Color tokens

```css
/* Brand */
--color-deep-plum: #111a4a;        /* primary brand accent — used on logo, primary buttons (non-CTA), key data highlights */
--color-faded-grid-blue: #023247;  /* illustrative depth in diagrams + background patterns */

/* Action */
--color-action-orange: #ec652b;    /* PRIMARY CTA — Stake, Try It, View on OKLink */
--color-callout-cyan: #167e6c;     /* secondary interactive (Reveal Pending, Awaiting Resolution badges) */
--color-notification-teal: #88deeb;/* supporting iconography only */

/* Neutrals */
--color-code-black: #000000;       /* sparingly: hairline borders, max-emphasis numerals */
--color-ink-blue: #011821;         /* headings, body */
--color-graphite: #121616;         /* darker text on lighter cards (Column spec listed as #12161 — corrected to #121616 here) */
--color-charcoal-text: #232730;    /* body text on white */
--color-slate-text: #7c7f88;       /* secondary labels, timestamps, captions */
--color-steel-gray: #e3e4e8;       /* borders, separators */
--color-fog-gray: #f6f6f8;         /* secondary section backgrounds */
--color-ghost-white: #ffffff;      /* primary page background */

/* Semantic */
--color-success-moss: #44b48b;     /* Resolved (won), Claim available */
--color-info-blue: #7ea7e9;        /* informational chips (not actionable) */

/* Gradients (decorative, used VERY sparingly) */
--gradient-soft-horizon: linear-gradient(125deg, #d65620 -3.16%, #9f7aee 14.55%, #4575cd 32.26%, #71d2f0 49.97%, #44b48b 67.68%, #f4df69 85.39%);
--gradient-radial-twilight: radial-gradient(29.88% 184.91% at 6.55% -48.11%, #771c86 0%, #111a4a 100%);
```

**Application rules** (strict, AI-judge-aware):
- `--color-action-orange` is the ONLY color used on primary CTAs. Period.
- `--color-deep-plum` is for brand identity (logo, top nav text, primary non-CTA buttons), NOT for status indicators.
- `--color-info-blue` is decorative/informational only — never for actionable elements (avoid generic-blue-button dilution).
- `--color-success-moss` and `--color-notification-teal` are semantic — won/won-pending status, not decorative.
- Gradients: `--gradient-radial-twilight` may appear ONCE in the hero behind the headline; `--gradient-soft-horizon` is reserved for the marquee section divider, used ONCE per page maximum.

#### 8.1.2 Typography

Primary typeface: **SuisseIntl** (300, 400, 500, 600). Fallback: **Inter**. License note: SuisseIntl is commercial; for the hackathon, the production deployment uses Inter with `font-feature-settings: 'salt' 2` to approximate SuisseIntl's stylistic alternates. The Inter fallback is the actual default in `--font-suisseintl` declaration.

Mono: **SFMono** for code blocks, tx hashes, monetary values. Fallback: **IBM Plex Mono** (free, ships in `geist` package).

Type scale (Minor Third 1.2 from 14px base):

| Token | Size | Line height | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `--text-caption` | 10px | 1.5 | normal | 400 | timestamps, tx hash labels |
| `--text-body` | 14px | 1.5 | -0.28px | 400 | body, default |
| `--text-subheading` | 18px | 1.4 | -0.36px | 400 | section subheads |
| `--text-heading-sm` | 24px | 1.33 | -0.48px | 500 | card titles |
| `--text-heading` | 40px | 1.1 | -0.8px | 500 | section heads |
| `--text-display` | 48px | 1 | -1.44px | 600 | hero |

Display + heading: SuisseIntl 500/600 with negative letter-spacing (Column rule).
Body + caption: Inter 400.
Numerals (stats, odds, amounts): always SFMono — alignment > prose.

#### 8.1.3 Spacing & shape

- Base unit: 4px (every spacing value is a 4-multiple)
- Section gap: 48px (vertical rhythm between landing sections — Column standard)
- Element gap inside section: 24px
- Border radius: 8px default (cards, buttons), 2px on hairlines/chips, 12px on featured cards
- Container max-width: 1280px desktop, 100% mobile, with 32px horizontal padding ≥640px

#### 8.1.4 Shadows

Layered, low-opacity (Column rule). Defined as design tokens:

```css
--shadow-card: rgba(17, 26, 74, 0.05) 0px 0px 0px 1px,
               rgba(0, 0, 0, 0.10) 0px 1px 2px 0px,
               rgba(255, 255, 255, 0.50) 0px 0px 0px 1px inset;

--shadow-hover: rgba(17, 26, 74, 0.10) 0px 1px 3px 0px,
                rgba(17, 26, 74, 0.05) 0px 1px 0px 0px,
                rgba(255, 255, 255, 0.50) 0px 1px 0px 0px inset,
                rgba(255, 255, 255, 0.50) 0px 1px 4px 0px inset;

--shadow-elevated: rgba(0, 0, 0, 0.02) 0px 40px 32px 0px,
                   rgba(0, 0, 0, 0.03) 0px 22px 18px 0px,
                   rgba(0, 0, 0, 0.03) 0px 12px 10px 0px,
                   rgba(0, 0, 0, 0.04) 0px 7px 5px 0px,
                   rgba(0, 0, 0, 0.07) 0px 3px 2px 0px;
```

NO heavy drop shadows. NO bevel/emboss. NO opaque dark overlays.

#### 8.1.5 Signature decorative elements

To carry the "blueprint" feel through the page (without becoming literal):

1. **Dot grid background** — barely-visible 24px-pitch dot pattern on the body, `rgba(17, 26, 74, 0.04)`. Recedes immediately on scroll but anchors the architectural feel.
2. **Vertical hairline rules** — `1px solid var(--color-steel-gray)` separating column sections in the hero stat row.
3. **Hex-corner cards** — featured cards have a 1px Action Orange "L" notch in the top-right corner (8px × 8px) — subtle terminal/blueprint reference.
4. **Tx-hash strip** — fixed-bottom horizontal strip on the dashboard, monospace, showing the latest 5 on-chain events with their hash. Continuously updating. Pure cinema for AI judges.

### 8.2 Landing page — section-by-section architecture

The landing is `packages/web/src/app/page.tsx`. Section IDs are component names. Layered top-to-bottom, each is independently scrollable and screenshotable.

```
┌─────────────────────────────────────────────────────────────┐
│  S0  TopNavBar                  (sticky, blur on scroll)     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  S1  HeroFold                                                │
│     ├─ Eyebrow chip: "LIVE NOW · UEFA Conference League Final" (only when match active) │
│     ├─ Display headline: "Live football prop markets, made by AI agents." │
│     ├─ Sub: muted slate, two-sentence positioning            │
│     ├─ Primary CTA: "View Live Markets" (orange)             │
│     ├─ Secondary CTA: "Read the Whitepaper" (text + arrow)   │
│     └─ Background: radial-twilight gradient, 8% opacity      │
│                                                              │
│  S2  StatBar                    (4-column, vertical hairlines)│
│     ├─ Markets created          (SFMono numerals, count-up)   │
│     ├─ USDT0 settled            (SFMono $K notation)          │
│     ├─ Matches covered          (integer)                     │
│     └─ Active agents            ("11 / 11" — always)          │
│                                                              │
│  S3  LiveMarketsTicker          (horizontal-scrolling, real data) │
│     └─ Cards: each shows agent name, proposition, odds, time-left, tx-hash chip │
│                                                              │
│  S4  HowItWorks                 (4-step flow diagram)         │
│     ├─ Step 1: Agent commits     (icon + caption + code snippet aside) │
│     ├─ Step 2: Reveal opens stake │
│     ├─ Step 3: Fans stake via x402 │
│     └─ Step 4: Hook settles      │
│                                                              │
│  S5  TheEleven                  (3-column grid, 11 cards)     │
│     └─ Each card: agent name in SuisseIntl 500, role, persona description, "View" link │
│                                                              │
│  S6  ProtocolStack              (architecture diagram)        │
│     └─ Layered diagram: Match feed → Agents → v4 Hook → USDT0 │
│        with each box clickable to a doc page                  │
│                                                              │
│  S7  InfrastructureManifest     (split panel — left text, right code) │
│     ├─ Title: "Built different."                              │
│     ├─ Body: 3 paragraphs on the two open-source primitives   │
│     └─ Right: code snippet showing `paymentMiddlewareFromConfig` with our facilitator │
│                                                              │
│  S8  LiveDataProof              (3 OKLink-linked tx hash cards) │
│     └─ Headline: "Every transaction is real. On X Layer mainnet." │
│                                                              │
│  S9  TryItFold                  (Farcaster frame mockup + iframe) │
│     ├─ Headline: "Stake from Farcaster. One tap. No gas."     │
│     └─ Embedded frame preview (real, working)                 │
│                                                              │
│  S10 OpenSourceFooter           (repo links + license + tags) │
│                                                              │
│  S11 Footer                     (regista11.xyz · @regista11 · github · OKX X Cup + Hook the Future tags) │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

Each section file lives at `packages/web/src/components/landing/{SectionName}.tsx`.

### 8.3 App routes

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Landing (sections S0–S11 above) |
| `/markets` | `app/markets/page.tsx` | All markets (active, closed, resolved) with filter chips |
| `/market/[address]` | `app/market/[address]/page.tsx` | Single market detail: agent, proposition, stake widget, OKLink links, claim path |
| `/agents` | `app/agents/page.tsx` | The Eleven grid + recent activity feed |
| `/agent/[name]` | `app/agent/[name]/page.tsx` | Single-agent dashboard: markets created, win rate, total volume, latest commit |
| `/docs` | `app/docs/page.tsx` | Architecture, contracts, x402 facilitator, how-to-resolve |
| `/api/frame/[market]` | `app/api/frame/[market]/route.ts` | Farcaster Frame v2 GET — initial render |
| `/api/frame/stake` | `app/api/frame/stake/route.ts` | Farcaster Frame POST — handle stake action |

### 8.4 Component library

`packages/web/src/components/`:

#### 8.4.1 Layout
- `<TopNavBar>` — sticky, blurs on scroll, contains logo + nav + connect-wallet
- `<Container>` — 1280px max, responsive padding
- `<Section>` — vertical 48px section gap wrapper
- `<HairlineRule>` — 1px steel-gray separator (vertical or horizontal)

#### 8.4.2 Hero & marketing
- `<HeroFold>` — landing S1
- `<EyebrowChip>` — small uppercase tracker chip, used for "LIVE NOW" badge
- `<DisplayHeadline>` — 48px SuisseIntl, used in hero
- `<StatBar>` — landing S2, 4-column with hairlines
- `<StatTile>` — single stat with label + value + sublabel
- `<CountUp>` — animated number on view (Motion `useInView`)

#### 8.4.3 Data display
- `<LiveMarketsTicker>` — landing S3, infinite-scroll marquee
- `<MarketCard>` — compact + expanded variants
- `<MarketStateBadge>` — colored chip: Committed (slate), Revealed (cyan), Active (orange), Closed (slate), Resolved (moss), Refunded (slate)
- `<OddsDisplay>` — SFMono percentages with split-bar visualization
- `<TxHashChip>` — truncated hash, OKLink icon link
- `<TxHashStrip>` — fixed-bottom dashboard strip, latest 5 events
- `<AgentCard>` — landing S5, agent persona card
- `<AgentAvatar>` — generated SVG glyph per persona (see §8.5)

#### 8.4.4 Interaction
- `<StakeWidget>` — yes/no buttons, amount slider, "Stake $X USDT0" CTA (orange)
- `<ClaimButton>` — appears on resolved+won markets
- `<RefundButton>` — appears on refunded markets
- `<ConnectWalletButton>` — wagmi v2 + RainbowKit, top-right of nav

#### 8.4.5 Diagrammatic
- `<HowItWorksFlow>` — landing S4, animated 4-step
- `<ProtocolStackDiagram>` — landing S6, layered architecture
- `<CodeBlock>` — SFMono on `--color-fog-gray` background, copy button top-right

#### 8.4.6 Utility
- `<HexCornerCard>` — card with the Action Orange L-notch
- `<ToastSurface>` — top-right notification stack for tx status

### 8.5 Iconography

**Primary library:** `lucide-react` (latest). Reasons: line-based weight matches SuisseIntl, available globally, no license issues, 1400+ icons.

**Custom SVG glyphs** (designed in Figma, exported as React components in `packages/web/src/icons/`):
- `<RegistaMark>` — the brand symbol (single dot with directional vectors, per branding brief direction)
- `<AgentGlyph variant={1..11}>` — per-agent identifying glyph; each persona has a distinctive tactical-board mark
- `<PitchOutline>` — abstracted football-pitch border (used as a decorative element, NOT as a literal pitch)
- `<XLayerMark>` — X Layer chain logo (SVG, downloaded from OKX brand kit)
- `<UniswapV4Mark>` — Uniswap v4 hook glyph (from Uniswap brand kit)
- `<USDT0Mark>` — USDT0 token mark (from Tether brand kit)

**Icon usage rules:**
- All icons render at 16px or 20px in body context, 24px in card heads, 40px in section illustrations
- Stroke width: 1.5px (Lucide default) — never bolder
- Color: inherits from text color via `currentColor`

### 8.6 Animations (Motion library, sparingly)

| Element | Animation | Trigger |
|---|---|---|
| Hero headline | Staggered word reveal (40ms stagger) | Page load |
| StatBar numerals | Count-up | `useInView` |
| LiveMarketsTicker | Continuous horizontal scroll, 60s loop | Always |
| Section reveals | Fade + 12px up | `useInView` once |
| MarketCard hover | Lift 1px, shadow → `--shadow-hover` | Hover |
| TxHashStrip new entry | Slide in from right, 200ms | New tx event |
| Connect button | Subtle pulse on "LIVE NOW" badge | While match active |

NO scroll-jacking. NO parallax. NO loading spinners on initial render — skeleton states only.

### 8.7 Responsive

- ≥1280px: full landing layout
- 768–1279px: single-column on S5 (TheEleven), 2-column stat bar
- <768px: mobile-first — stack everything, hide TxHashStrip on landing (keep on dashboard), reduce hero display size to 32px

Tested at: 1440, 1280, 1024, 768, 414, 375.

### 8.8 Performance budgets

- LCP < 2.0s on Vercel Edge
- CLS < 0.05
- TBT < 200ms
- Bundle size: landing JS < 180KB gzipped, app routes < 250KB
- Images: SVG only for icons; AVIF for any photographic assets (none expected)

### 8.9 Accessibility

- WCAG AA contrast on all text/background pairs
- Focus states visible (2px Action Orange ring, 2px offset)
- Keyboard nav for stake widget
- `aria-live="polite"` on TxHashStrip
- Reduced-motion respect: animations gated on `prefers-reduced-motion`

---

## 9. Data & state

### 9.1 Indexer — Goldsky subgraph

Schema (`packages/indexer/schema.graphql`):

```graphql
type Market @entity {
  id: Bytes!                              # hook address
  matchId: Bytes!
  agent: Agent!
  commitHash: Bytes!
  revealedParams: Bytes
  marketDeadline: BigInt!
  resolveDeadline: BigInt!
  state: MarketState!
  totalYes: BigInt!
  totalNo: BigInt!
  outcome: Int
  createdAt: BigInt!
  resolvedAt: BigInt
  stakes: [Stake!]! @derivedFrom(field: "market")
}

type Stake @entity {
  id: Bytes!                              # txHash + logIndex
  market: Market!
  user: Bytes!
  side: Int!
  amount: BigInt!
  txHash: Bytes!
  createdAt: BigInt!
  claimed: Boolean!
  claimedAmount: BigInt
}

type Agent @entity {
  id: Bytes!                              # wallet address
  index: Int!
  name: String!
  marketsCreated: BigInt!
  totalVolume: BigInt!
  winRate: BigDecimal
  markets: [Market!]! @derivedFrom(field: "agent")
}

enum MarketState {
  COMMITTED
  REVEALED
  ACTIVE
  CLOSED
  RESOLVED
  REFUNDED
}
```

Indexer runs on Goldsky after Day 2 (post-contract-deploy). Until then, frontend reads directly from RPC.

### 9.2 Frontend data layer

- `@tanstack/react-query` for all server reads
- `wagmi v2` for wallet + contract reads
- Edge cache (Vercel) on `/markets`, `/agents` list endpoints — 30s revalidate
- WebSocket connection to `wss://graph-mainnet.goldsky.com/...` for real-time market state on `/market/[address]` page

### 9.3 State persistence

- Agent runtime: SQLite via Prisma (see §5.8)
- Frontend: React Query cache + URL state (filters, sort)
- No localStorage for sensitive data
- No backend session — wallet connection is the session

---

## 10. Security model

| # | Layer | Threat | Mechanism | Enforcement point |
|---|---|---|---|---|
| 1 | Agent self-dealing | Agent observes match state, then creates a market with known outcome | Commit-reveal — params committed before reveal, hashed with agent address | On-chain in `_beforeInitialize` and `reveal()` |
| 2 | Stake replay | Same EIP-3009 sig submitted twice | Per-nonce `authorizationState` mapping on USDT0 | USDT0 contract |
| 3 | Oracle manipulation (admin path) | Resolver lies | All resolutions on-chain transparent + `outcomeProof` event field + post-resolve dispute period (24h before claim activates) | `hook.resolve()` + UI dispute display |
| 4 | Oracle manipulation (Flap path, stretch) | Bridge message forged | Hyperlane/LayerZero verified sender + Flap signature | bridge contract |
| 5 | Hook re-entrancy | Malicious USDT0 callback during stake/claim | `ReentrancyGuard` from OZ on `stake`/`claim`/`refund` | hook contract |
| 6 | Reveal griefing | Agent commits, never reveals — locks user funds | `refund()` opens after `resolveDeadline` | hook contract |
| 7 | Facilitator key | Hot key compromised | Small float (1 OKB max), automated alert on balance jump, rotation script | Off-chain monitoring |
| 8 | Frontend XSS | Injected via market proposition text | Strict CSP, all user-visible strings escaped, no `dangerouslySetInnerHTML` | Next.js middleware |
| 9 | API-Football outage | Match data unavailable mid-game | Agent skips ticks gracefully; markets opened before outage still resolvable via cached state | Agent runtime retry logic |
| 10 | RPC outage | Can't read or write to X Layer | Three RPC providers, viem fallback transport | viem config |

Day-of-demo additions:
- 11. Replay-from-screenshot resistance: every demo screenshot includes a tx hash, AI judges can verify on OKLink
- 12. **No private key in any code, log, screenshot, or message** — explicit verification before any push

---

## 11. Build calendar

Per playbook rule: **demo screenplay is locked (Phase D, prior turn).** Build follows the screenplay; the demo doesn't get retrofitted to the build.

### Day 1 — Friday, May 23

**Foundation. All package scaffolding. Hello-world for every track.**

| Component | Outcome |
|---|---|
| Monorepo init | pnpm workspace, packages/contracts + packages/agent + packages/web + packages/x402-facilitator (already exists) + packages/indexer |
| Contracts scaffold | Foundry workspace, `PropMarketHook.sol` skeleton (compiles, no logic), CREATE2 mining script |
| Web scaffold | Next.js 15 app, design tokens loaded via `theme.css`, top nav + hero stub (Section S1 only) |
| Agent scaffold | Node + tsx, base agent class, dummy persona, mock match feed |
| x402 facilitator | Publish npm package, deploy hosted endpoint to Railway @ facilitator.regista11.xyz |
| Indexer | Goldsky project created, deferred to Day 2 |

**End of day 1:** Every package builds. Landing page hero renders. Empty `PropMarketHook` compiles and passes a one-line "exists" test. Facilitator npm package published.

### Day 2 — Saturday, May 24

**Smart contracts. Both `PropMarketHook` + `PropMarketHookFactory` fully implemented, tested, deployed.**

| Component | Outcome |
|---|---|
| PropMarketHook | All §4 functions + invariants + events |
| PropMarketHookFactory | createMarket + CREATE2 + agent registry |
| Foundry tests | All §4.8 test files, ≥95% line coverage |
| Deploy | Both contracts to X Layer mainnet; addresses captured |
| Blockscout verify | Both contracts verified |
| Web S2-S4 | StatBar (reads chain stats), LiveMarketsTicker (empty state), HowItWorks (static SVG) |

**End of day 2:** Contracts live on X Layer, addresses published to README, all tests green.

### Day 3 — Sunday, May 25

**Agent runtime. 3 personas live (Il Regista, Il Trequartista, Il Mediano). End-to-end commit → reveal works on a real fixture.**

| Component | Outcome |
|---|---|
| Agent core | Base class + tick loop + persistence (SQLite) |
| Il Regista | Full implementation + proposition templates |
| Il Trequartista | Full implementation |
| Il Mediano | Full implementation |
| Skill chain | Onchain OS calls wired (all 5 skills enumerated in §5.3) |
| Match feed | API-Football client + state diff detection |
| Commit-reveal | Tested end-to-end with a real fixture (any midweek match) |
| Web S5-S6 | TheEleven grid (3 cards filled, 8 placeholders), ProtocolStackDiagram |

**End of day 3:** Three agents tick during a live (or recently-finished) match. At least one commit → reveal cycle completes on-chain successfully.

### Day 4 — Monday, May 26

**Frontend dashboard. Live data wired. Farcaster frame works. First end-to-end live test.**

| Component | Outcome |
|---|---|
| Goldsky subgraph | Schema deployed, indexes from contract deployment block |
| /markets | Active + resolved markets list, filter chips |
| /market/[address] | Detail page + StakeWidget functional (real tx through facilitator) |
| /agents | The Eleven dashboard |
| Farcaster frame | Stake from a real Farcaster post → real tx on X Layer |
| Web S7-S11 | Remaining landing sections |
| First live test | Agents run during a Tuesday-night fixture (any), Tim stakes from his own wallet, market resolves, claim works |

**End of day 4:** Full E2E loop works end-to-end with at least one real fan (Tim) staking from a real wallet.

### Day 5 — Tuesday, May 27 (morning)

**Day 5 GATE — STOP-AND-VERIFY.**

**Gate criteria (verbatim, must ALL pass before Day 5 PM work begins):**

```
GATE PASS requires ALL SIX:

[ ] 1. PropMarketHookFactory.createMarket() tx on X Layer mainnet, OKLink-verified,
       hook address captured.

[ ] 2. PropMarketHook.reveal() tx on X Layer mainnet, OKLink-verified, ParametersRevealed
       event emitted at correct block height.

[ ] 3. A real wallet (NOT the burner, NOT an agent wallet) signs an EIP-3009
       TransferWithAuthorization for USDT0 → tokens land in the PropMarketHook
       contract → StakeRecorded event emitted with that wallet's address.

[ ] 4. admin resolve() tx on X Layer mainnet, OKLink-verified, MarketResolved event
       emitted with binary outcome.

[ ] 5. claim() tx by the staking wallet from step 3 → USDT0 returned to staker
       per their share → StakeClaimed event.

[ ] 6. Frontend at regista11.xyz displays correct state at every phase
       (committed, revealed, active, closed, resolved, claimable, settled)
       within 30 seconds of the corresponding chain event.

NO MOCKS. NO TESTNET. ALL ON X LAYER MAINNET.

If ANY criterion fails: STOP. Surface the failure. Do not proceed to demo
recording on Day 5 PM.

Time budget: gate must close by 12:00 UTC May 27. If still red at 14:00,
fall back to a Day 4 friendly recording as the demo (real on-chain, just
not Conference League Final).
```

### Day 5 — Tuesday, May 27 (afternoon)

**All 11 personas branded + final UI polish + final pre-record check.**

| Component | Outcome |
|---|---|
| Personas 4–11 | Il Falso Nove, Il Libero, L'Ala, Il Bomber, Il Capitano, Il Numero Dieci, Il Catenaccio, L'Ultimo all implemented |
| AgentGlyph SVGs | All 11 designed and integrated |
| Landing final pass | All sections polished, mobile tested, contrast verified |
| README v1 | Drafted (final pass Day 8) |
| OBS recording setup | Source layout configured for demo capture |
| Test recording | A 60-second test recording during pre-match warm-up |

### Day 5 — Tuesday, May 27 (evening) — DEMO RECORDING

**21:00 CEST (19:00 UTC) — UEFA Conference League Final kickoff, Crystal Palace vs Rayo Vallecano, Red Bull Arena Leipzig.**

- 18:30 UTC: All 11 agents started, monitoring confirmed
- 18:50 UTC: First markets created (pre-match propositions)
- 19:00 UTC: Kickoff — OBS recording begins
- 19:00–20:45 UTC: Continuous recording, agents operating live
- 20:45 UTC: Recording stop (likely mid-second-half — enough material captured)
- 20:45–23:00 UTC: Demo video editing per Phase D screenplay
- 23:00 UTC: Demo video uploaded to YouTube (unlisted until submission)

### Day 8 — Wednesday, May 28 — SUBMIT

| Time | Action |
|---|---|
| 06:00 UTC | README dual-track final pass |
| 08:00 UTC | X thread drafted, hero image attached |
| 10:00 UTC | X Cup Google Form submitted |
| 11:00 UTC | Hook the Future Google Form submitted |
| 12:00 UTC | X thread posted, all three accounts re-tagged |
| 13:00–23:00 UTC | Monitoring, responding to judge questions if any |
| 23:59 UTC | DEADLINE — already submitted ~10 hours prior |

---

## 12. Submission artifacts

### 12.1 README structure (dual-track)

`/README.md` — root of repo:

```markdown
# Regista 11

> Live football prop markets, made by eleven AI agents. Built on X Layer.

[Hero screenshot — landing page]

## TL;DR

Eleven AI agents autonomously create binary prediction markets during live
football matches. Fans stake gasless in USDT0 via the first permissionless
x402 facilitator built for X Layer. Settlement runs through a custom Uniswap
v4 Hook. Every transaction on X Layer mainnet — no mocks, no testnet.

**Live demo:** [YouTube link]
**Dapp:** https://regista11.xyz
**Twitter:** @regista11

---

## Quick links by hackathon

### For OKX X Cup judges → see [`docs/X_CUP.md`](./docs/X_CUP.md)
### For Hook the Future judges → see [`docs/HOOK_THE_FUTURE.md`](./docs/HOOK_THE_FUTURE.md)

---

## Architecture

[Architecture diagram — same as PRD §3.1]

[Component table]

## Live transactions (mainnet)

| Type | Hash | Explorer |
|---|---|---|
| Factory deploy | 0x... | OKLink |
| First market created | 0x... | OKLink |
| First reveal | 0x... | OKLink |
| First stake (via x402) | 0x... | OKLink |
| First resolve | 0x... | OKLink |
| First claim | 0x... | OKLink |

## The Eleven

[Table from PRD §5.1]

## x402 facilitator

The first permissionless x402 facilitator built for X Layer.
[Description, npm install, repo link]

## Repository layout

[File tree]

## Build & deploy

[Setup instructions]

## Security

[Table from PRD §10]

## License

MIT (all packages)

## Acknowledgments

- OKX X Layer team
- Uniswap v4 + OpenZeppelin uniswap-hooks
- Flap (oracle path, stretch goal)
```

`docs/X_CUP.md` — leads with WC narrative, agent layer, live demo.
`docs/HOOK_THE_FUTURE.md` — leads with v4 Hook + x402 facilitator + composability.

### 12.2 Demo video — see Phase D screenplay

### 12.3 X thread — see Phase D screenplay

### 12.4 Submission Google Forms — separate per event

| Field | X Cup answer | Hook the Future answer |
|---|---|---|
| Project name | Regista 11 | Regista 11 |
| Track | Prediction Markets / AI Agent | Hook the Future |
| Demo URL | regista11.xyz | regista11.xyz |
| GitHub | github.com/winsznx/regista11 | same |
| Video | YouTube link | same |
| Team | Tim (@winsznx) | same |
| One-liner | "Eleven AI agents make live football prop markets on X Layer" | "Novel Uniswap v4 Hook + first permissionless x402 facilitator for X Layer" |
| Tech stack | X Layer, OKX x402, Onchain OS, Uniswap v4, USDT0, EIP-3009, Next.js 15, Foundry, viem | same |

---

## 13. Open decisions (to confirm before Day 1 starts)

| # | Decision | Recommendation | Why |
|---|---|---|---|
| 1 | X social branding consistency | Pivot the X profile branding to Column-aesthetic (light, deep-plum + action-orange) | Brand should feel unified; the dark Italian-tactical brief was pre-Column pivot |
| 2 | Agent runtime language | TypeScript + Node | Tim's stack; one runtime, one toolchain |
| 3 | Icon library | Lucide React | Best line-weight match for SuisseIntl, no license issue |
| 4 | Indexer | Goldsky | Stronger X Layer support per research vs Envio |
| 5 | Resolution path Day 5 GATE | Admin EOA (Tim) | Flap UMA bridge is Day 6 stretch only; admin works for GATE |
| 6 | Facilitator deployment surface | npm + hosted (facilitator.regista11.xyz) | Both for max public-good story |
| 7 | Wallet used for Day 5 GATE stake | A fresh wallet (not Tim's primary, not the burner) | Looks like a real user, not insider |
| 8 | Subgraph wait if Goldsky slow | Frontend reads RPC directly via wagmi until subgraph green | Doesn't block Day 4 |
| 9 | SuisseIntl font availability | Use Inter as `--font-suisseintl` fallback for prod, ship SuisseIntl post-license | License cost vs hackathon timeline |
| 10 | Mobile-first Farcaster frame OR desktop dApp priority | Frame is a discovery tool, dApp is the experience — both Day 4 | Frame is one screen, dApp is the moat |

---

## 14. Appendix

### A. File structure (full)

```
regista11/
├── README.md
├── package.json                          # pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json                            # turborepo for build orchestration
├── .env.example
├── docs/
│   ├── X_CUP.md
│   ├── HOOK_THE_FUTURE.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   └── DEPLOYMENT.md
├── packages/
│   ├── x402-facilitator/                 # DONE Day 0
│   │   ├── src/
│   │   │   ├── usdt0.ts
│   │   │   ├── eip712.ts
│   │   │   ├── XLayerFacilitatorClient.ts
│   │   │   ├── cache.ts
│   │   │   └── server.ts                 # Express wrapper for hosted endpoint
│   │   ├── test/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── contracts/
│   │   ├── foundry.toml
│   │   ├── remappings.txt
│   │   ├── src/
│   │   │   ├── PropMarketHook.sol
│   │   │   ├── PropMarketHookFactory.sol
│   │   │   ├── interfaces/
│   │   │   │   ├── IPropMarketHook.sol
│   │   │   │   └── IPropMarketHookFactory.sol
│   │   │   └── libraries/
│   │   │       └── PropMarketLib.sol
│   │   ├── test/
│   │   │   ├── PropMarketHook.t.sol
│   │   │   ├── PropMarketHook.invariants.t.sol
│   │   │   ├── PropMarketHook.eip3009.t.sol
│   │   │   └── PropMarketHookFactory.t.sol
│   │   └── script/
│   │       ├── Deploy.s.sol
│   │       ├── MineSalt.s.sol            # CREATE2 mining
│   │       └── RegisterAgents.s.sol
│   ├── agent/
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── BaseAgent.ts
│   │   │   │   ├── TickLoop.ts
│   │   │   │   └── Persistence.ts
│   │   │   ├── personas/
│   │   │   │   ├── IlRegista.ts
│   │   │   │   ├── IlTrequartista.ts
│   │   │   │   ├── IlMediano.ts
│   │   │   │   ├── IlFalsoNove.ts
│   │   │   │   ├── IlLibero.ts
│   │   │   │   ├── LAla.ts
│   │   │   │   ├── IlBomber.ts
│   │   │   │   ├── IlCapitano.ts
│   │   │   │   ├── IlNumeroDieci.ts
│   │   │   │   ├── IlCatenaccio.ts
│   │   │   │   └── LUltimo.ts
│   │   │   ├── propositions/
│   │   │   │   ├── templates.ts
│   │   │   │   └── resolvers.ts
│   │   │   ├── skills/
│   │   │   │   ├── createMarket.ts
│   │   │   │   ├── revealMarket.ts
│   │   │   │   └── readMatchState.ts
│   │   │   ├── matches/
│   │   │   │   ├── ApiFootballClient.ts
│   │   │   │   └── MatchStateDiff.ts
│   │   │   ├── commit/
│   │   │   │   └── CommitReveal.ts
│   │   │   ├── wallets/
│   │   │   │   └── AgentWallets.ts
│   │   │   └── index.ts                  # orchestrator entrypoint
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx              # Landing
│   │   │   │   ├── markets/page.tsx
│   │   │   │   ├── market/[address]/page.tsx
│   │   │   │   ├── agents/page.tsx
│   │   │   │   ├── agent/[name]/page.tsx
│   │   │   │   ├── docs/page.tsx
│   │   │   │   └── api/
│   │   │   │       └── frame/
│   │   │   │           ├── [market]/route.ts
│   │   │   │           └── stake/route.ts
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── TopNavBar.tsx
│   │   │   │   │   ├── Container.tsx
│   │   │   │   │   ├── Section.tsx
│   │   │   │   │   └── HairlineRule.tsx
│   │   │   │   ├── landing/
│   │   │   │   │   ├── HeroFold.tsx
│   │   │   │   │   ├── StatBar.tsx
│   │   │   │   │   ├── LiveMarketsTicker.tsx
│   │   │   │   │   ├── HowItWorks.tsx
│   │   │   │   │   ├── TheEleven.tsx
│   │   │   │   │   ├── ProtocolStack.tsx
│   │   │   │   │   ├── InfrastructureManifest.tsx
│   │   │   │   │   ├── LiveDataProof.tsx
│   │   │   │   │   ├── TryItFold.tsx
│   │   │   │   │   ├── OpenSourceFooter.tsx
│   │   │   │   │   └── Footer.tsx
│   │   │   │   ├── data/
│   │   │   │   │   ├── MarketCard.tsx
│   │   │   │   │   ├── MarketStateBadge.tsx
│   │   │   │   │   ├── OddsDisplay.tsx
│   │   │   │   │   ├── TxHashChip.tsx
│   │   │   │   │   ├── TxHashStrip.tsx
│   │   │   │   │   ├── AgentCard.tsx
│   │   │   │   │   ├── AgentAvatar.tsx
│   │   │   │   │   └── CountUp.tsx
│   │   │   │   ├── interaction/
│   │   │   │   │   ├── StakeWidget.tsx
│   │   │   │   │   ├── ClaimButton.tsx
│   │   │   │   │   ├── RefundButton.tsx
│   │   │   │   │   └── ConnectWalletButton.tsx
│   │   │   │   ├── diagrammatic/
│   │   │   │   │   ├── HowItWorksFlow.tsx
│   │   │   │   │   ├── ProtocolStackDiagram.tsx
│   │   │   │   │   └── CodeBlock.tsx
│   │   │   │   └── utility/
│   │   │   │       ├── HexCornerCard.tsx
│   │   │   │       ├── EyebrowChip.tsx
│   │   │   │       └── ToastSurface.tsx
│   │   │   ├── icons/
│   │   │   │   ├── RegistaMark.tsx
│   │   │   │   ├── AgentGlyph.tsx
│   │   │   │   ├── PitchOutline.tsx
│   │   │   │   ├── XLayerMark.tsx
│   │   │   │   ├── UniswapV4Mark.tsx
│   │   │   │   └── USDT0Mark.tsx
│   │   │   ├── lib/
│   │   │   │   ├── wagmi.ts
│   │   │   │   ├── contracts.ts
│   │   │   │   ├── goldsky.ts
│   │   │   │   ├── x402.ts
│   │   │   │   └── format.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useMarket.ts
│   │   │   │   ├── useMarkets.ts
│   │   │   │   ├── useAgents.ts
│   │   │   │   ├── useLiveTxs.ts
│   │   │   │   └── useStake.ts
│   │   │   └── styles/
│   │   │       ├── globals.css
│   │   │       ├── theme.css              # design tokens (Column-derived)
│   │   │       └── variables.css
│   │   ├── public/
│   │   │   ├── fonts/                     # Inter via next/font, SuisseIntl deferred
│   │   │   ├── og.png                     # OG card
│   │   │   └── favicon.svg
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── indexer/
│       ├── schema.graphql
│       ├── subgraph.yaml
│       ├── src/
│       │   ├── factory.ts                 # PropMarketHookFactory handlers
│       │   └── hook.ts                    # PropMarketHook handlers
│       └── package.json
└── .github/
    └── workflows/
        ├── contracts-test.yml             # forge test on every push
        ├── web-build.yml
        ├── x402-test.yml
        └── deploy.yml
```

### B. Pinned dependencies (the wall)

Captured here so every package's `package.json` can be diffed against this canonical list. Versions locked to Day 0 verifications.

```json
{
  "@okxweb3/x402-core": "0.1.0",
  "@okxweb3/x402-evm": "0.1.0",
  "@okxweb3/x402-express": "0.1.0",
  "@uniswap/v4-core": "1.0.2",
  "@uniswap/v4-periphery": "1.0.3",
  "@openzeppelin/uniswap-hooks": "1.1.1",
  "viem": "2.39.3",
  "wagmi": "2.x",
  "@rainbow-me/rainbowkit": "2.x",
  "@tanstack/react-query": "5.x",
  "next": "15.x",
  "react": "19.x",
  "motion": "12.x",
  "lucide-react": "latest",
  "@neynar/nodejs-sdk": "latest",
  "prisma": "5.x",
  "@prisma/client": "5.x",
  "tsx": "4.x",
  "vitest": "2.x",
  "forge-std": "1.x"
}
```

### C. Deployed addresses

**Already deployed (Day 0):**
- Burner / Day-0 facilitator wallet: `0x1661A6D4D25123aFbbbBBCF3805ADd4c3161F088`
- USDT0 (X Layer): `0x779Ded0c9e1022225f8E0630b35a9b54bE713736`
- Uniswap v4 PoolManager (X Layer): `0x360e68faccca8ca495c1b759fd9eee466db9fb32`
- CREATE2 deployer (canonical): `0x4e59b44847b379578588920cA78FbF26c0B4956C`

**To deploy (Day 1):**
- PropMarketHookFactory: TBD
- Hosted facilitator endpoint: `facilitator.regista11.xyz`
- 11 agent wallets: TBD (BIP-44 derived)
- Resolver wallet: TBD (Tim's, separate from agent wallets)

**Reference (BSC, read-only for stretch):**
- Flap WorldCupResolver: `0x134C6b9562E226096947e018ddEe4804c9146921`
- Flap AI Oracle: `0xaEe3a7Ca6fe6b53f6c32a3e8407eC5A9dF8B7E39`
- Flap Trigger Service: `0xcf4EE25035CF883895110f367F5BA8172416a7F9`

### D. Glossary

| Term | Meaning |
|---|---|
| x402 | HTTP 402 Payment Required, standardized as a protocol by OKX's SDK |
| EIP-3009 | Gas-less token transfer via signed authorization (`transferWithAuthorization`) |
| USDT0 | Tether's USD on X Layer; EIP-3009 + EIP-2612 enabled |
| v4 Hook | Uniswap v4 contract that intercepts pool lifecycle (initialize, swap, add/remove liquidity) |
| Commit-reveal | Cryptographic primitive: commit a hash, later reveal the preimage |
| Onchain OS | OKX's catalog of agent skills (wallet, gateway, signal, security) |
| Flap | UMA-based oracle suite on BSC, supports cross-chain attestation |
| Regista | Italian football: deep-lying playmaker who directs play |
| Goldsky | Hosted subgraph indexer with strong X Layer support |
| X Layer | OKX's OP-Stack L2, chain ID 196 |
| The Eleven | Regista 11's 11 named AI agent personas |

### E. License

MIT for all packages. Repository banner notes attribution to:
- OpenZeppelin (uniswap-hooks)
- Uniswap (v4-core, v4-periphery)
- OKX (x402 SDK, Onchain OS)
- Tether (USDT0)
- Flap (oracle, stretch only)

---

## 15. Sign-off

This PRD is canonical for the May 23 – May 28 build window. Changes require explicit revision in the changelog (§0).

Day 5 GATE criteria (§11) are immovable. Demo recording (Day 5 PM) follows the Phase D screenplay verbatim. Submission (Day 8) follows the templates in §12.

If any contradiction emerges between this PRD and an in-flight code prompt, **this PRD wins** unless the prompt explicitly notes a deliberate amendment.

— End of PRD v1.0