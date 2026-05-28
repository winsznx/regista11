# @regista11/x402-facilitator

Gasless USDT0 settlement facilitator for [X Layer](https://www.okx.com/xlayer) (chain 196).

Lets your dApp accept stake / payment in **USDT0** without forcing the user to hold gas. The user signs one EIP-712 typed-data payload (EIP-3009 `transferWithAuthorization`); your relayer wallet broadcasts the transfer and pays OKB. One signature, zero gas for the user.

> Originally extracted from [Regista 11](https://regista11.xyz) — the live football outcome market on X Layer. Works for any X Layer protocol that wants to ship gasless USDT0 payments.

## What it does

1. Accepts an EIP-3009 typed-data signature from the staker.
2. Verifies the signer matches the `from` field, the nonce is unused, and the authorization window is open.
3. Calls `USDT0.transferWithAuthorization(from, to, value, validAfter, validBefore, nonce, v, r, s)` from your relayer wallet.
4. Returns the resulting on-chain tx hash.

The USDT0 contract is at `0x779Ded0c9e1022225f8E0630b35a9b54bE713736`. Its EIP-712 domain name is **`USD₮0`** — note the U+20AE TUGRIK glyph; the package matches this byte-for-byte and will reject signatures built against the ASCII `T` form.

## Install

```bash
pnpm add @regista11/x402-facilitator
# or
npm install @regista11/x402-facilitator
```

`viem >= 2.30` is a peer dependency.

## Quickstart

```ts
import {
  XLayerFacilitatorClient,
  USDT0_ADDRESS,
} from "@regista11/x402-facilitator";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xLayer } from "viem/chains";

const account = privateKeyToAccount(process.env.RELAYER_PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({ chain: xLayer, transport: http() });
const walletClient = createWalletClient({ chain: xLayer, transport: http(), account });

const facilitator = new XLayerFacilitatorClient({
  publicClient,
  walletClient,
  usdt0Address: USDT0_ADDRESS,
});

// The user signs this typed-data in their wallet (the EIP-712 payload
// is what xLayerFacilitator.buildTypedData() returns — match the
// `domain.name` exactly: "USD₮0" with U+20AE).
const result = await facilitator.relayTransfer({
  from: "0x…",
  to: "0x…",
  value: 5_000_000n, // 6-decimal USDT0 micros → $5.00
  validAfter: 0n,
  validBefore: BigInt(Math.floor(Date.now() / 1000) + 300),
  nonce: "0x…",     // 32 bytes
  signature: "0x…", // 65 bytes — v, r, s concatenated
});

console.log("tx hash:", result.transactionHash);
```

## EIP-712 typed-data the user signs

```json
{
  "types": {
    "EIP712Domain": [
      { "name": "name",              "type": "string"  },
      { "name": "version",           "type": "string"  },
      { "name": "chainId",           "type": "uint256" },
      { "name": "verifyingContract", "type": "address" }
    ],
    "TransferWithAuthorization": [
      { "name": "from",        "type": "address" },
      { "name": "to",          "type": "address" },
      { "name": "value",       "type": "uint256" },
      { "name": "validAfter",  "type": "uint256" },
      { "name": "validBefore", "type": "uint256" },
      { "name": "nonce",       "type": "bytes32" }
    ]
  },
  "domain": {
    "name":              "USD₮0",
    "version":           "1",
    "chainId":           196,
    "verifyingContract": "0x779Ded0c9e1022225f8E0630b35a9b54bE713736"
  },
  "primaryType": "TransferWithAuthorization",
  "message": { "...": "..." }
}
```

The constant `USDT0_DOMAIN_NAME` is exported so you don't have to hand-type the TUGRIK glyph.

## Exports

| Name | Kind | What |
|---|---|---|
| `XLayerFacilitatorClient` | class | The main client — `relayTransfer()`, `verifyAuthorization()` |
| `XLayerFacilitatorConfig` | type | Constructor config |
| `TransferAuthorization` | type | EIP-3009 authorization struct |
| `computeDomainSeparator()` | function | Computes the USDT0 domain separator |
| `recoverTransferSigner()` | function | Recovers the signer address from an EIP-3009 signature |
| `splitSignature()` | function | Splits a 65-byte hex signature into `{ v, r, s }` |
| `SettlementCache` | class | In-memory nonce cache (replay guard) |
| `USDT0_ADDRESS`, `USDT0_CHAIN_ID`, `USDT0_DOMAIN_NAME`, `USDT0_DECIMALS`, … | const | USDT0 constants |
| `USDT0_ABI` | const | Minimal ABI for `transferWithAuthorization` + balance reads |
| `TRANSFER_WITH_AUTHORIZATION_TYPES` | const | EIP-712 types object — drop straight into `signTypedData` |

## Production notes

- The relayer wallet needs OKB for gas — every relay is a real transaction on chain 196.
- Run one relayer instance per chain to keep the EVM nonce queue serialized. Multi-instance behind a load balancer will collide.
- The in-memory `SettlementCache` covers replay-within-window. For horizontal scale, back it with Redis / KV.

## See it live

The reference deployment is the staking flow at [regista11.xyz](https://regista11.xyz) — every market is a Uniswap v4 hook on X Layer, every stake is a gasless USDT0 transfer relayed through this facilitator. Docs at [regista11.xyz/docs/gasless-staking](https://regista11.xyz/docs/gasless-staking).

## License

MIT © 2026 Regista 11
