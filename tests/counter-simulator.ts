import {
  type CircuitContext,
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../managed/counter/contract/index.js";
import { type CounterPrivateState, witnesses } from "../scripts/witnesses.js";

// Runs the contract locally against an in-memory ledger, the same way the
// on-chain runtime would, so circuits (including their asserts) execute for real.
export class CounterSimulator {
  readonly contract: Contract<CounterPrivateState>;
  circuitContext: CircuitContext<CounterPrivateState>;

  constructor(secretKey: Uint8Array) {
    this.contract = new Contract<CounterPrivateState>(witnesses);
    const { currentPrivateState, currentContractState, currentZswapLocalState } =
      this.contract.initialState(
        createConstructorContext({ secretKey }, "0".repeat(64)),
      );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
    );
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): CounterPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  // Impersonate a different caller: same public contract state, different
  // private key. Used to prove the owner gate actually gates.
  public usePrivateKey(secretKey: Uint8Array): void {
    this.circuitContext = {
      ...this.circuitContext,
      currentPrivateState: { secretKey },
    };
  }

  public increment(): Ledger {
    this.circuitContext = this.contract.impureCircuits.increment(
      this.circuitContext,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }
}
