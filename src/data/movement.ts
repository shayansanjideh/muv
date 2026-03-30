/**
 * Movement blockchain knowledge base.
 * Used by both the REPL system prompt and the MCP server.
 */

export const MOVEMENT_KNOWLEDGE = `
## What is Movement?

Movement is a Layer 1 blockchain built natively for the Move programming language and virtual machine. It is an independent, decentralized blockchain with its own consensus mechanism, validator set, and governance. Movement brings the Move language — originally from the Aptos ecosystem — to developers everywhere, providing a purpose-built platform optimized for digital assets, DeFi, NFTs, and enterprise use cases.

## Key Facts

- **Chain ID**: 126 (Mainnet), 250 (Testnet/Bardock)
- **Native Token**: MOVE (used for gas fees, staking, and governance)
- **Consensus**: BFT Proof-of-Stake (modified HotStuff algorithm)
- **Finality**: Single-slot, sub-second transaction confirmation
- **Throughput**: 10,000+ TPS with burst capacity
- **Block Time**: ~1-2 seconds
- **VM**: Native MoveVM (direct Move bytecode execution)
- **Smart Contract Language**: Move (resource-oriented, formally verifiable)

## Network Endpoints

- **Mainnet RPC**: https://mainnet.movementnetwork.xyz/v1
- **Testnet RPC**: https://testnet.movementnetwork.xyz/v1
- **Explorer**: https://explorer.movementnetwork.xyz/?network=mainnet
- **Faucet (testnet)**: https://faucet.movementnetwork.xyz/
- **Bridge**: https://bridge.movementnetwork.xyz/ (LayerZero-powered, Ethereum <> Movement)
- **Indexer GraphQL**: https://indexer.mainnet.movementnetwork.xyz/v1/graphql
- **Status**: https://status.movementnetwork.xyz/

## Token Standards

- **Fungible Asset (FA)**: Modern token standard with type-safe operations, automatic storage init, granular permissions, and dispatchable custom transfer logic. Recommended for new tokens.
- **Digital Asset (DA)**: Modern NFT framework built on Move Objects. Supports composability (NFTs owning NFTs), direct transfers, fixed/unlimited supply collections.
- **Legacy Coin/Token**: Older standards maintained for backward compatibility.

## Bridged Assets

LayerZero bridge connects Ethereum <> Movement. Bridged tokens include USDC.e, USDT.e, WETH.e, WBTC.e (the ".e" suffix indicates Ethereum-bridged).

## DeFi Ecosystem

Key protocols on Movement:
- **Meridian**: Primary DEX with AMM and concentrated liquidity (CLAMM) pools
- **Canopy**: Yield vaults and strategies (cvMOVE, cvUSDC.e, etc.)
- **IPX**: DEX with stable and volatile liquidity pools
- **Pyth Network**: Oracle price feeds for DeFi applications

## Developer Tools

- **Movement CLI**: Drop-in replacement for Aptos CLI (use \`movement\` instead of \`aptos\`)
- **SDKs**: TypeScript, Python, Rust
- **Aptos-compatible wallets**: Work on Movement via wallet adapter
- **Move 2 features**: Enums, receiver-style functions, index notation, compound assignments, package visibility

## Architecture

- Five-layer architecture: API, Execution, Storage, Consensus, Network
- Parallel transaction processing via Block-STM
- Merkle tree-based state commitments
- Ed25519 cryptographic authentication
- Dynamic validator set with stake-weighted leader selection
- Slashing for malicious/negligent validators

## Staking

- Users stake MOVE tokens to validators via delegation pools
- Rewards distributed proportionally based on stake
- Operator commission model with configurable rates
`.trim();
