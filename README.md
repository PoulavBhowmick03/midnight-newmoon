# midnight-newmoon — Owner-Gated Counter

> A Compact contract on Midnight where anyone can *watch* the counter, but only the holder of a never-revealed secret key can *move* it.

Level 1 (🌑 New Moon) submission for the Midnight Builder Challenge on Rise In.

## Contract Address

| Network | Address                      |
|---------|------------------------------|
| Preprod | `[PENDING — deploy in progress]` |

## What This Does

The contract keeps a public counter (`round`) and a public *commitment* — a hash — of the owner's 32-byte secret key. Calling `increment()` requires re-deriving that commitment inside the ZK circuit from the caller's private key material. If the hash matches, the counter moves; if not, the proof simply cannot be constructed. On-chain observers see the count change and can verify the proof, but they never learn the key, and nothing about the key ever leaves the owner's machine.

It is deliberately the smallest contract that exercises all three core Midnight primitives: public ledger state, a private witness, and an explicit `disclose()`.

## Public State vs Private Witness

Compact splits every contract into two worlds:

- **Ledger state** (`export ledger ...`) lives on-chain and is readable by anyone, exactly like Ethereum storage.
- **Witnesses** (`witness ...`) are callbacks resolved *locally* by the caller's own machine at proof time. Their values feed the circuit but are never part of the transaction. The compiler taints everything derived from a witness; if tainted data would reach public state or a return value, compilation fails unless you wrap it in `disclose()` — making every leak of private data a deliberate, visible decision in the source.

### Privacy Model

- **PUBLIC (on-chain, visible to anyone):**
  - `round` — the current counter value
  - `owner` — `persistentHash("newmoon:owner:", secretKey)`, a one-way commitment
- **PRIVATE (private witness, never on-chain):**
  - `localSecretKey()` — the owner's 32-byte secret key, supplied by the local TypeScript runner
- **What the caller PROVES without revealing:**
  - "I know the preimage of the stored commitment" — i.e. *I am the owner* — with the key never appearing in the transaction, the ledger, or the proof.

The single `disclose()` in the contract publishes the *hash* of the key at deploy time. That is the entire public footprint of the secret.

## Tech Stack

- Midnight network (Preprod), Compact language (compiler 0.31.1)
- `@midnight-ntwrk/compact-runtime` + `midnight-js` SDK 4.x, Node.js v22, Docker (proof server 8.0.3), vitest

## Prerequisites

- Node.js v22
- Docker (for the proof server)
- Compact developer tools: `curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh`, then `compact update`

## Setup

```bash
git clone https://github.com/PoulavBhowmick03/midnight-newmoon.git
cd midnight-newmoon
npm install

# compile the contract → managed/counter (circuits + keys)
npm run compile

# start the proof server
docker compose up -d proof-server

# deploy to Preprod (prints a wallet address; fund it at the faucet when prompted)
npm run deploy -- --network preprod
```

The deploy generates a fresh wallet seed (stored in `.midnight-state.json`) and the owner secret key (stored in `.owner-secret`). Both are gitignored — fund the printed address at the Preprod faucet and the script continues automatically.

## Run Tests

```bash
npm test
```

Four tests run the compiled circuits against an in-memory ledger: deterministic initialization (commitment, not key, on-chain), owner increments, wrong-key rejection with untouched public state, and a check that the secret key never appears in any public output.

## Initial Idea

**Nightmark — private endorsements, public reputation.** Builders accumulate a public, verifiable reputation score, but *who* endorsed them stays private. Each endorser proves in-circuit that they hold an eligibility credential (e.g. a hackathon-participant or DAO-member key) and that they haven't endorsed this builder before (nullifier), then bumps the builder's public counter — identity never disclosed. On a transparent chain, endorsement graphs get scraped, gamed, and socially weaponized; on Midnight, the *score* is public and sybil-resistant while the social graph behind it simply doesn't exist on-chain. The Level 1 owner-gated counter is the seed of exactly this mechanism: commitment-gated counting.

## Screenshots

*(to be added: successful `compact compile` output with circuits listed, and the deployed contract address)*
