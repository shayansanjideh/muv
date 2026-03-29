# muv CLI — Implementation Summary

## Branch
`feature/muv-cli` (commit `a99129a`)

## What Was Built
Complete v1 implementation of **muv**, a natural language CLI for the Movement blockchain. Users type plain English and muv translates intent into on-chain actions via Claude API tool_use.

## Files Created (22 files, ~2750 lines)

### Project Config
- `package.json` — npm package with `muv` bin entry, deps: `@anthropic-ai/sdk`, `@aptos-labs/ts-sdk`
- `tsconfig.json` — TypeScript config targeting ES2022/Node16
- `.gitignore` — excludes node_modules, dist, .claude, logs

### Source (`src/`)
| File | Purpose |
|------|---------|
| `bin/muv.ts` | Shebang entry point |
| `index.ts` | REPL loop, first-run onboarding (wallet + personality) |
| `config.ts` | Read/write `~/.config/muv/config.json` (personality, API key) |
| `wallet.ts` | Generate/import/load wallet from `~/.config/muv/wallet.json` |
| `data/tokens.ts` | Hardcoded registry of all 57 tokens with exact faAddress + decimals |
| `ai/client.ts` | Singleton Anthropic SDK client |
| `ai/prompts.ts` | System prompt with full token list + personality mode |
| `ai/intent.ts` | ConversationManager: tool definitions, tool dispatch loop, Claude messages API |
| `chain/client.ts` | Aptos SDK configured for Movement mainnet RPC |
| `chain/balance.ts` | Single-token and all-token balance queries via fungible asset API |
| `chain/transfer.ts` | Build MOVE native transfer or fungible asset transfer payloads |
| `chain/transactions.ts` | Build, simulate, sign+submit transactions |
| `protocols/meridian/swap.ts` | AMM and CLAMM swap payload builders (both Meridian contracts) |
| `protocols/meridian/pool.ts` | Pool info and LP position queries |
| `protocols/meridian/farming.ts` | Farming position queries, stake/unstake/claim payloads |
| `ui/display.ts` | Format balances, transaction previews, success/error messages |
| `ui/confirm.ts` | Mandatory y/n confirmation before any transaction |

## AI Tool Definitions
Five tools registered with Claude:
1. `get_balances` — all non-zero token balances
2. `get_token_balance` — single token balance
3. `swap_tokens` — Meridian AMM/CLAMM swap with confirmation
4. `transfer_tokens` — token transfer with confirmation
5. `get_positions` — Meridian LP and farming positions

## Key Design Decisions
- **Conversation context preserved** — `ConversationManager` maintains full message history per session
- **Tool use loop** — handles multi-turn tool calls until Claude returns text
- **Mandatory confirmation** — all transactions show preview (action, amounts, gas) and require y/n
- **Personality modes** — terse vs friendly, selected at first run, stored in config
- **57 tokens hardcoded** — exact addresses from spec, no fabrication

## Build Status
`tsc` compiles cleanly with zero errors. Output in `dist/`.

## What's NOT Done (Future Work)
- No tests yet
- No actual Meridian contract ABI verification (payload shapes are best-effort based on common DEX patterns)
- No price fetching (would need an oracle or DEX quote endpoint)
- No transaction history queries
- Wallet stores private key in plaintext (per spec, but flagged as security concern)
- No mnemonic import support (only raw private key)
