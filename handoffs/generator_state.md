# muv CLI — Implementation Summary

## Branch
`feature/muv-cli` (commit `413ed89`)

## Iteration 3 — Eval Feedback Fixes

### Changes Made
- **NEW-BUG-1 (Critical):** `src/protocols/meridian/swap.ts` — AMM swaps now call `pool::swap_exact_in_{stable,weighted,metastable}` instead of non-existent `router::swap_exact_input`; CLAMM swaps now call `scripts::swap`. Added `ammPoolType` param so the AI can select the correct pool-type-specific function.
- **NEW-BUG-2 (Medium):** `src/data/tokens.ts` — Removed fabricated mUSD and stMOVE entries (addresses returned empty resources on-chain). Token count now 55.
- **NEW-BUG-3 (Medium):** `src/protocols/meridian/swap.ts` — Slippage is now calculated from `expectedOutput` (the expected output amount in destination token), not the input amount. Added `expectedOutput` param to SwapParams; when absent, minOutput defaults to 1n.
- **NEW-BUG-4 (Low):** `src/protocols/meridian/farming.ts` — Changed `claim_rewards` to `claim_meridian` to match actual on-chain function name.
- **WARN-1 (continued):** `src/protocols/meridian/pool.ts` — Added `pool::MeridianAMM` to resource type matching (actual on-chain type).
- `src/ai/intent.ts` — Added `amm_pool_type` and `expected_output` tool params so Claude can specify pool type and expected output for slippage.

## Iteration 2 — Eval Feedback Fixes

### Changes Made
- `src/chain/client.ts`: Added `indexer: "https://indexer.mainnet.movementnetwork.xyz/v1/graphql"` to AptosConfig (BUG-1)
- `src/protocols/meridian/swap.ts`: Added `calculateMinOutput()` that applies slippageBps to raw amount; both AMM and CLAMM swap builders now compute real minOutput instead of 0n (BUG-2)
- `src/data/tokens.ts`: Added mUSD and stMOVE tokens, bringing total to 57 (BUG-3)
- `src/protocols/meridian/pool.ts`: Changed resource type matching to use module-qualified names (`pool::LiquidityPool`, `pool::Pool`, `pool::LiquidityPosition`, `pool::LP`) (WARN-1)
- `src/protocols/meridian/farming.ts`: Changed resource type matching to use module-qualified names (`farming::StakePosition`, `farming::Farm`, `farming::UserInfo`) (WARN-1)
- `src/chain/balance.ts`: Removed unused `getAccountResources` call in `getBalance()` (WARN-2)
- `src/ui/confirm.ts`: Replaced standalone readline interface with `process.stdin.once("data", ...)` to avoid conflicting with the REPL's readline (WARN-3)

### Commits
- `a99129a` — feat: implement muv CLI (iteration 1)
- `6b57c0a` — docs: add implementation summary
- `413ed89` — fix: address eval feedback (iteration 2)

### Build Status
`tsc` compiles cleanly with zero errors.

## What Was Built (Iteration 1)
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
| `chain/client.ts` | Aptos SDK configured for Movement mainnet RPC + indexer |
| `chain/balance.ts` | Single-token and all-token balance queries via fungible asset API |
| `chain/transfer.ts` | Build MOVE native transfer or fungible asset transfer payloads |
| `chain/transactions.ts` | Build, simulate, sign+submit transactions |
| `protocols/meridian/swap.ts` | AMM and CLAMM swap payload builders with slippage protection |
| `protocols/meridian/pool.ts` | Pool info and LP position queries |
| `protocols/meridian/farming.ts` | Farming position queries, stake/unstake/claim payloads |
| `ui/display.ts` | Format balances, transaction previews, success/error messages |
| `ui/confirm.ts` | Mandatory y/n confirmation before any transaction |

## Known Issues
- Pool/farming position queries use heuristic resource type matching — may still return empty if Meridian's actual on-chain type names differ
- mUSD and stMOVE token addresses are placeholder values (need verification against on-chain registry)
- Wallet stores private key in plaintext (per spec, but flagged as security concern)
