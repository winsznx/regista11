import { describe, it, expect } from "vitest";
import { loadDeployment } from "../src/config/deployment.js";
import { INFRA } from "../src/config/infra.js";
import { tryGetFactoryAddress } from "../src/contracts/addresses.js";

describe("deployment loader", () => {
  it("returns null when xlayer-mainnet.json is absent (current pre-broadcast state)", () => {
    // Default path points at packages/contracts/deployments/xlayer-mainnet.json
    // which does not yet exist — Tim hasn't broadcast.
    const result = loadDeployment();
    expect(result).toBeNull();
  });

  it("tryGetFactoryAddress returns null in the same state", () => {
    expect(tryGetFactoryAddress()).toBeNull();
  });

  it("rejects a malformed deployment JSON", () => {
    // Point at any pre-existing JSON that doesn't match the schema.
    const bogusPath = new URL("./wallets.test.ts", import.meta.url).pathname;
    expect(() => loadDeployment(bogusPath)).toThrow();
  });
});

describe("INFRA constants", () => {
  it("locks chainId 196", () => {
    expect(INFRA.chainId).toBe(196);
  });
  it("USDT0 + PoolManager match Day-0 known-good", () => {
    expect(INFRA.usdt0.toLowerCase()).toBe(
      "0x779Ded0c9e1022225f8E0630b35a9b54bE713736".toLowerCase()
    );
    expect(INFRA.poolManager.toLowerCase()).toBe(
      "0x360e68faccca8ca495c1b759fd9eee466db9fb32"
    );
  });
});
