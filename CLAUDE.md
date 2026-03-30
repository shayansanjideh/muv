# muv — Movement Blockchain Plugin

muv gives you Movement blockchain superpowers in Claude Code. Check balances, swap tokens on Meridian DEX, transfer MOVE, and learn about the Movement ecosystem — all through plain English.

## First-Time Setup

**IMPORTANT**: When the user first interacts with muv (asks about balances, tokens, swaps, etc.), call `get_wallet_info` first. If it returns an error (no wallet configured), guide them through setup:

1. Ask if they want to generate a new wallet or import an existing private key
2. Generate/import and save to the wallet config
3. Then proceed with their original request

The user should never need to know about `/muv:setup` — just handle it automatically.

## About Movement

Movement is a Layer 1 blockchain built for the Move programming language. Chain ID 126 (mainnet). Native token is MOVE (gas, staking, governance). BFT Proof-of-Stake consensus with sub-second finality and 10,000+ TPS.

**Endpoints**: RPC at `https://mainnet.movementnetwork.xyz/v1`, Explorer at `https://explorer.movementnetwork.xyz`, Bridge at `https://bridge.movementnetwork.xyz`.

**Ecosystem**: Meridian DEX (AMM + CLAMM), Canopy yield vaults, IPX DEX, Pyth oracles. Bridged tokens from Ethereum have `.e` suffix (USDC.e, WETH.e, etc.).

## Available Tools

- `get_wallet_info` — Returns the configured wallet address. Call this first before any wallet operation.
- `get_movement_info` — Answer questions about Movement blockchain, MOVE token, ecosystem, DeFi protocols, network endpoints, developer resources.
- `get_balances` — All token balances (wallet auto-detected, no need to ask user for address)
- `get_token_balance` — Specific token balance (wallet auto-detected)
- `swap_tokens` — Swap on Meridian DEX
- `transfer_tokens` — Send tokens to an address
- `get_positions` — LP and farming positions on Meridian

## Key Behavior

- **Never ask the user for their wallet address** — it's auto-detected from config
- **Answer Movement questions directly** — use `get_movement_info`, don't explore the codebase
- **Always preview transactions** before executing (swaps, transfers)
- **If wallet not configured** — guide user through setup automatically
