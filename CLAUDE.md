# muv — Movement Blockchain CLI

muv is a natural language interface for the Movement blockchain. It works as both an interactive REPL (with Anthropic/OpenAI API keys) and an MCP server (for Claude Code with Pro/Max plans).

## About Movement

Movement is a Layer 1 blockchain built for the Move programming language. Chain ID 126 (mainnet). Native token is MOVE (gas, staking, governance). BFT Proof-of-Stake consensus with sub-second finality and 10,000+ TPS.

**Endpoints**: RPC at `https://mainnet.movementnetwork.xyz/v1`, Explorer at `https://explorer.movementnetwork.xyz`, Bridge at `https://bridge.movementnetwork.xyz`.

**Ecosystem**: Meridian DEX (AMM + CLAMM), Canopy yield vaults, IPX DEX, Pyth oracles. Bridged tokens from Ethereum have `.e` suffix (USDC.e, WETH.e, etc.).

## MCP Server

When running as an MCP server (`muv --mcp`), the following tools are available:

- `get_wallet_info` — Returns the configured wallet address (auto-reads from ~/.config/muv/wallet.json)
- `get_movement_info` — Returns knowledge about Movement blockchain, ecosystem, and DeFi
- `get_balances` — All token balances (wallet auto-detected)
- `get_token_balance` — Specific token balance
- `swap_tokens` — Swap on Meridian DEX
- `transfer_tokens` — Send tokens to an address
- `get_positions` — LP positions on Meridian
