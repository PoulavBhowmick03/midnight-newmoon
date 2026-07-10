import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger } from "../managed/counter/contract/index.js";

// The owner's private state. This lives only in the local runner's memory —
// it is handed to the circuit as a witness and never leaves the machine.
export type CounterPrivateState = {
  secretKey: Uint8Array;
};

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, CounterPrivateState>): [
    CounterPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
};
