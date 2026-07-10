# midnight-newmoon : Owner-Gated Counter

> A Compact contract on Midnight where anyone can *watch* the counter, but only the holder of a never-revealed secret key can *move* it.

Level 1 submission for the Midnight Builder Challenge on Rise In.

## Contract Address

| Network | Address                      |
|---------|------------------------------|
| Preprod | `[PENDING : deploy in progress]` |

## What This Does

The contract keeps a public counter (`round`) and a public *commitment* : a hash : of the owner's 32-byte secret key. Calling `increment()` requires re-deriving that commitment inside the ZK circuit from the caller's private key material. If the hash matches, the counter moves; if not, the proof simply cannot be constructed. On-chain observers see the count change and can verify the proof, but they never learn the key, and nothing about the key ever leaves the owner's machine.

It is deliberately the smallest contract that exercises all three core Midnight primitives: public ledger state, a private witness, and an explicit `disclose()`.

## Public State vs Private Witness

Compact splits every contract into two worlds:

- Ledger state (`export ledger ...`) lives on-chain and is readable by anyone, exactly like Ethereum storage.
- Witnesses (`witness ...`) are callbacks resolved *locally* by the caller's own machine at proof time. Their values feed the circuit but are never part of the transaction. The compiler taints everything derived from a witness; if tainted data would reach public state or a return value, compilation fails unless you wrap it in `disclose()` : making every leak of private data a deliberate, visible decision in the source.

### Privacy Model

- PUBLIC (on-chain, visible to anyone):
  - `round` : the current counter value
  - `owner` : `persistentHash("newmoon:owner:", secretKey)`, a one-way commitment
- PRIVATE (private witness, never on-chain):
  - `localSecretKey()` : the owner's 32-byte secret key, supplied by the local TypeScript runner
- What the caller PROVES without revealing:
  - "I know the preimage of the stored commitment" : i.e. *I am the owner* : with the key never appearing in the transaction, the ledger, or the proof.

The single `disclose()` in the contract publishes the *hash* of the key at deploy time. That is the entire public footprint of the secret.
