import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, expect, it } from "vitest";
import { pureCircuits } from "../managed/counter/contract/index.js";
import { CounterSimulator } from "./counter-simulator.js";

setNetworkId("undeployed");

const OWNER_KEY = new Uint8Array(32).fill(7);
const INTRUDER_KEY = new Uint8Array(32).fill(9);

describe("Owner-gated counter", () => {
  it("initializes: round is 0 and owner holds the key COMMITMENT, not the key", () => {
    const sim = new CounterSimulator(OWNER_KEY);
    const state = sim.getLedger();

    expect(state.round).toEqual(0n);
    // owner must equal hash(prefix, key)...
    expect(state.owner).toEqual(pureCircuits.ownerCommitment(OWNER_KEY));
    // ...and must NOT be the raw key itself.
    expect(state.owner).not.toEqual(OWNER_KEY);
  });

  it("increments when the caller knows the owner's secret key", () => {
    const sim = new CounterSimulator(OWNER_KEY);

    expect(sim.increment().round).toEqual(1n);
    expect(sim.increment().round).toEqual(2n);
  });

  it("rejects increment from a caller with the wrong secret key", () => {
    const sim = new CounterSimulator(OWNER_KEY);
    sim.increment();

    sim.usePrivateKey(INTRUDER_KEY);
    expect(() => sim.increment()).toThrow(/Not the counter owner/);

    // Public state untouched by the failed attempt.
    sim.usePrivateKey(OWNER_KEY);
    expect(sim.getLedger().round).toEqual(1n);
  });

  it("never exposes the secret key in any public ledger state", () => {
    const sim = new CounterSimulator(OWNER_KEY);
    sim.increment();

    const state = sim.getLedger();
    // The only public fields are the count and the commitment.
    const publicBytes = Buffer.from(state.owner).toString("hex");
    const keyBytes = Buffer.from(OWNER_KEY).toString("hex");
    expect(publicBytes).not.toContain(keyBytes);
    // The key stays exactly where it started: in local private state.
    expect(sim.getPrivateState().secretKey).toEqual(OWNER_KEY);
  });
});
