# muv

Talk to the Movement blockchain in plain English.

muv is an [MCP server](https://modelcontextprotocol.io) that gives any AI agent (Claude Code, Cursor, Windsurf, etc.) the ability to interact with the Movement blockchain. No API keys needed — just connect and go.

## Quick Start

```bash
# Clone and build
git clone https://github.com/shayansanjideh/muv.git
cd muv
npm install
npm run build

# Add to Claude Code
cp muv-mcp.json .mcp.json  # or add to your project's .mcp.json

# Start Claude Code
claude
```

Then just talk:

```
> what's my balance at 0x1234...?
> swap 10 USDC.e for MOVE
> send 5 MOVE to 0xabcd...
> show my Meridian positions
```

## Setup

### 1. Install

```bash
git clone https://github.com/shayansanjideh/muv.git
cd muv
npm install
npm run build
```

### 2. Configure Your Wallet

Set your private key as an environment variable:

```bash
export MUV_PRIVATE_KEY="your_private_key_hex"
```

Or add it to your MCP config so it's always available:

```json
{
  "mcpServers": {
    "muv": {
      "command": "node",
      "args": ["/path/to/muv/dist/bin/muv.js"],
      "env": {
        "MUV_PRIVATE_KEY": "your_private_key_hex"
      }
    }
  }
}
```

If no env var is set, Claude will ask for your private key when you try to sign a transaction.

### 3. Connect to Your AI Agent

**Claude Code** — add to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "muv": {
      "command": "node",
      "args": ["/path/to/muv/dist/bin/muv.js"]
    }
  }
}
```

**Cursor / Windsurf** — add the same config to your MCP settings.

## Tools

muv exposes 5 tools to your AI agent:

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `get_balances` | Get all non-zero token balances for a wallet | No |
| `get_token_balance` | Get balance of a specific token | No |
| `swap_tokens` | Swap tokens on Meridian DEX (AMM or CLAMM) | Yes |
| `transfer_tokens` | Send tokens to another address | Yes |
| `get_positions` | Query Meridian LP and farming positions | No |

### get_balances

Returns all non-zero token balances for a wallet address.

```
Input:  { wallet_address: "0x..." }
Output: { balances: [{ symbol: "MOVE", balance: "142.50", name: "MOVE", faAddress: "0x...0a" }, ...] }
```

### get_token_balance

Returns the balance of a specific token.

```
Input:  { wallet_address: "0x...", token_symbol: "USDC.e" }
Output: { symbol: "USDC.e", balance: "500.00", name: "USDC.e", faAddress: "0x8312..." }
```

### swap_tokens

Swaps tokens on Meridian DEX. Supports both AMM (stable, weighted, metastable pools) and CLAMM.

```
Input:  {
  from_token: "USDC.e",
  to_token: "MOVE",
  amount: "10",
  pool_address: "0x...",
  private_key: "0x...",        // optional if MUV_PRIVATE_KEY is set
  amm_pool_type: "stable",     // optional: stable | weighted | metastable
  use_clamm: false,            // optional: use CLAMM instead of AMM
  slippage_bps: 50,            // optional: default 0.5%
  expected_output: "28.3",     // optional: for slippage calculation
}
Output: { success: true, tx_hash: "0x...", details: { from: "10 USDC.e", to: "MOVE", ... } }
```

### transfer_tokens

Sends tokens to another address. Handles native MOVE and all fungible assets.

```
Input:  {
  token_symbol: "MOVE",
  recipient: "0x...",
  amount: "5",
  private_key: "0x...",        // optional if MUV_PRIVATE_KEY is set
}
Output: { success: true, tx_hash: "0x...", details: { token: "MOVE", amount: "5", recipient: "0x..." } }
```

### get_positions

Returns Meridian DEX liquidity pool and farming positions for a wallet.

```
Input:  { wallet_address: "0x..." }
Output: { lp_positions: [...], farming_positions: [...] }
```

## Supported Tokens

muv includes a hardcoded registry of 54 tokens on Movement mainnet:

**Core tokens:** MOVE, USDT.e, USDCx, USDC.e, WETH.e, WBTC.e, USDe, sUSDe, USDa, sUSDa, LBTC, stBTC, enzoBTC, solvBTC, ezETH, rsETH, weETH, frxUSD, sfrxUSD, MSD, LEAF, GUI, CAPY, mBTC, brBTC, OTC, savUSD

**Canopy vault tokens:** cvMOVE, cvUSDC.e, cvUSDT.e, cvWETH.e, cvWBTC.e, cvMER-LP, cvrsETH, cvezETH, cvLBTC, cvstBTC, cvSolvBTC, cvsUSDa, and more

**IPX LP tokens:** IPX s-USDCe/USDTe, IPX v-USDCe/MOVE, IPX v-USDTe/MOVE, IPX v-USDCe/WETHe, IPX v-MOVE/WETHe, IPX s-mUSD/USDCe, IPX s-wBTCe/mBTC

## Network

- **Chain:** Movement Mainnet (Chain ID 126)
- **RPC:** `https://mainnet.movementnetwork.xyz/v1`
- **Indexer:** `https://indexer.mainnet.movementnetwork.xyz/v1/graphql`

## Supported Protocols

### Meridian DEX (v1)

- **AMM:** Stable, weighted, and metastable pool swaps
- **CLAMM:** Concentrated liquidity swaps
- **Farming:** Position queries (AMM farming)

Contract addresses:
- AMM: `0xfbdb3da73efcfa742d542f152d65fc6da7b55dee864cd66475213e4be18c9d54`
- CLAMM: `0x88def51006db6ae8f90051a1531d1b43877eeb233f4c0d99dcb24f49cd27ad5b`
- Farming: `0xf1fc2bc72b9eeaa3cc80239d5c00e49ebab0b2c8a5b55227ce47644b3275ff96`

### Coming Soon

- MovePosition (borrow/lending)
- Canopy (yield vaults)
- Yuzu (DEX)
- Mosaic (DEX aggregator)
- Echelon (lending)
- Cross-DEX routing

## Architecture

```
User → AI Agent (Claude, Cursor, etc.) → MCP Protocol → muv server → Movement blockchain
```

muv is agent-agnostic. It doesn't bundle an LLM — your AI agent IS the LLM. muv just gives it blockchain tools.

## Security

- **Private keys** are either provided per-request or read from `MUV_PRIVATE_KEY` env var
- **No keys are stored on disk** by the MCP server
- **No keys are sent to any AI provider** — they go directly from env var to the Aptos SDK for signing
- **Transaction confirmation** is handled by your AI agent (Claude Code will ask before executing)
- This is v1 — use at your own risk with funds you can afford to lose

## Development

```bash
# Build
npm run build

# The MCP server communicates via stdio — run it through an MCP client, not directly
```

## License

MIT
