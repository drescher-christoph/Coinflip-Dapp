# Coinflip DApp

## Overview
Coinflip is a fully on-chain coin toss lottery. Players pick heads or tails, stake ETH, and receive their outcome once Chainlink VRF returns a verifiable random number. The contract manages bankroll, pays out winnings automatically (minus a 2% service fee), and logs every bet so the subgraph can expose live statistics. The project bundles a Foundry-based smart-contract workspace, a Next.js frontend with wallet support, and The Graph subgraph definitions for real-time analytics.

## Key Features
- Fair coinflip gameplay powered by Chainlink VRF v2.5 and deterministic payouts without custodial risk
- Fast UX with WalletConnect/RainbowKit, quick bet presets, and animated flip feedback
- Live statistics through a The Graph subgraph (latest bets, wins/losses, block and timestamp data)
- Multi-chain testnet support (Ethereum Sepolia, Arbitrum Sepolia, Optimism Sepolia) with configurable contract addresses
- Comprehensive Foundry tests and deployment scripts, including VRF subscription management helpers

## Project Structure
- `coinflip-backend/` – Foundry project containing `Coinflip.sol`, deployment/interaction scripts, and tests
- `coinflip-frontend/` – Next.js 15 App Router frontend (React 19, TypeScript, Tailwind CSS, Wagmi, RainbowKit)
- `coinflip-frontend/subgraphs/coinflip-arbitrum-sepolia/` – The Graph subgraph that indexes coinflip contract events

## Technology Stack
- **Smart Contracts:** Solidity 0.8.19, Chainlink VRF v2.5, Foundry (Forge, Cast, Anvil)
- **Frontend:** Next.js 15, React 19, RainbowKit, Wagmi, Ethers v6, React Query, Tailwind CSS 4, Confetti animations
- **Indexing & Data:** The Graph Studio, `graph-cli`, `matchstick-as` tests, GraphQL API for `BetResult` queries
- **Tooling:** TypeScript, `viem` for log decoding, optional CI-friendly scripts

## How It Works
1. A connected wallet selects heads or tails and the stake amount in the frontend.
2. The frontend calls `Coinflip.flip(bool guess)` and forwards the stake (payable). The contract submits a Chainlink VRF request.
3. Once Chainlink VRF responds, `fulfillRandomWords` compares the player guess to the random outcome and pays winnings (2 × stake minus the 2% fee).
4. The contract emits `BetPlaced` and `BetResult` events. The subgraph indexes them and exposes the data via GraphQL.
5. The frontend keeps statistics (e.g., the latest five bets) fresh through a React Query hook.

## Setup & Development
### Prerequisites
- Node.js ≥ 20 (npm is used in the repo)
- Foundry toolchain (`curl -L https://foundry.paradigm.xyz | bash` followed by `foundryup`)
- (Optional) Docker and `graph-cli` for local subgraph development (`npm install -g @graphprotocol/graph-cli`)
- WalletConnect Project ID and The Graph API token for the frontend environment

### Smart Contracts (Foundry)
```bash
cd coinflip-backend
forge install # only when new dependencies are needed
forge build
forge test
```

Local development with Anvil and the VRF mock:
```bash
anvil
forge script script/DeployCoinflip.s.sol:DeployCoinflip --rpc-url http://127.0.0.1:8545 --broadcast --private-key <ANVIL_KEY>
```

`DeployCoinflip.runLocal()` creates and funds a mock subscription on demand during tests and adds the contract as consumer. For testnet deployments, re-use the VRF coordinators and subscription IDs in `DeployCoinflip.s.sol`; align owner and subscription data with your own wallet setup.

### Frontend (Next.js)
1. Create `.env.local`:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project
   NEXT_PUBLIC_GRAPHQL_TOKEN=your_the_graph_api_token
   ```
2. Install dependencies and start the dev server:
   ```bash
   cd coinflip-frontend
   npm install
   npm run dev
   ```
3. Default contract addresses for Sepolia/Arbitrum/Optimism live in `src/constants.tsx`. Adjust `chainsToCoinflip` if you deploy elsewhere.

### Subgraph (The Graph)
```bash
cd coinflip-frontend/subgraphs/coinflip-arbitrum-sepolia
npm install
npm run codegen
npm run build
graph auth --studio coinflip-arbitrum-sepolia <THE_GRAPH_DEPLOY_KEY>
npm run deploy
```

For local experimentation spin up the provided `docker-compose.yml`, then run `npm run create-local` and `npm run deploy-local`. Mapping unit tests use `npm run test` (Matchstick-as).

## Tests
- `forge test` – Unit/integration tests for the smart contract including VRF-mock interactions
- `npm run test` (Subgraph) – Exercises the AssemblyScript mapping logic
- The frontend currently has no automated test suite; perform manual QA via `npm run dev`

## Deployment & Networks
Current testnet deployments (see `src/constants.tsx`):
- Ethereum Sepolia: `0x6359F02648E3E86272587F3fFD798b714A5BB3B9`
- Arbitrum Sepolia: `0x929f02317AccC9076eae706F5EC127F8cC948846`
- Optimism Sepolia: `0xd9cb648580743b790b474d7c3ce4388c5504cbe8`

When switching networks, update the frontend contract address, the subgraph `networks.json`, and the Chainlink VRF parameters (subscription ID, gas lane, callback gas limit).

## Additional Notes
- The contract charges a fixed 200 bps (2%) fee on winnings; `withdrawFees` lets the owner collect accumulated fees stored in `s_feesCollected`.
- The `receive()` function allows anyone to fund the contract so payouts stay solvent.
- Keep private keys secure; any script executed with `--broadcast` expects a valid `FOUNDRY_PRIVATE_KEY` environment variable or CLI flag.
- The UI uses `ethers.formatUnits` for amounts and `viem.decodeEventLog` for parsing logs; mismatched ABIs will cause runtime errors.

Good luck extending your Coinflip DApp! Potential next steps include leaderboards, mobile optimizations, and additional gas-saving techniques.
