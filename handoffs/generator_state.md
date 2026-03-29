# Generator State — Iteration 2

## Changes Made
- `src/data/tokens.ts`: Removed extra core token `M-BTC` (faAddress `0xc457...d80a`) to bring registry from 55 entries (28 core) down to exactly 54 entries (27 core + 20 Canopy vault + 7 IPX LP), matching AC-3.

## Commits
- `ac2e2a3` — fix: use Anthropic namespace types instead of deep SDK import path (iteration 1)
- `07679f7` — fix: remove extra M-BTC token to match required 54-token registry (iteration 2)

## Build Status
PASS — `rm -rf dist && npm run build` completes with exit code 0. All 17 source files compiled to `.js` and `.d.ts` in `dist/`.

## AC Verification Summary
- **AC-1:** PASS — `tsc` completes with 0 errors, `dist/` has all compiled files
- **AC-2:** PASS — Binary starts, shows onboarding when no wallet exists
- **AC-3:** PASS — Token registry now has exactly 54 entries (27 core + 20 Canopy vault + 7 IPX LP)
- **AC-4:** PASS — 5 tools defined with proper `input_schema`
- **AC-5:** PASS — `swap_tokens` dispatches to AMM or CLAMM correctly
- **AC-6:** PASS — `transfer_tokens` uses correct functions for MOVE vs fungible assets
- **AC-7:** PASS — Write transactions simulate + confirm before submitting
- **AC-8:** PASS — `ConversationManager` maintains history and loops on `tool_use`
- **AC-9:** PASS — System prompt includes token list, wallet address, personality adaptation
- **AC-10:** PASS — Aptos client configured for Movement mainnet

## Decisions
- Removed `M-BTC` as the extra core token. It was the 28th core token, only referenced in the registry itself (no other code depends on it), and the spec explicitly requires 27 core tokens. The remaining 27 core tokens are: MOVE, USDT.e, USDCx, USDC.e, WETH.e, WBTC.e, USDe, sUSDe, USDa, sUSDa, LBTC, stBTC, enzoBTC, solvBTC, ezETH, rsETH, weETH, frxUSD, sfrxUSD, MSD, LEAF, GUI, CAPY, mBTC, brBTC, OTC, savUSD.

## Known Issues
- **stdin conflict (spec Known Issue #2):** `confirmTransaction` reads from `process.stdin` via `.once("data")` while `readline.Interface` in `index.ts` also owns stdin. Acceptable for v1.
- **Conversation memory growth (spec Known Issue #3):** `ConversationManager` accumulates all messages without limit. Acceptable for v1.
