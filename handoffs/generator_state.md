# Generator State — Iteration 1

## Changes Made
- `src/ai/intent.ts`: Replaced fragile deep import from `@anthropic-ai/sdk/resources/messages.js` with `Anthropic.*` namespace type aliases (`MessageParam`, `Tool`, `ContentBlock`, `ToolUseBlock`, `ToolResultBlockParam`). This prevents potential runtime failures since the deep import path doesn't resolve as an ESM module at runtime. Also removed unused `TOKEN_REGISTRY` import.

## Commits
- `ac2e2a3` — fix: use Anthropic namespace types instead of deep SDK import path

## Build Status
PASS — `rm -rf dist && npm run build` completes with exit code 0. All 17 source files compiled to `.js` and `.d.ts` in `dist/`.

## Runtime Verification
- `ANTHROPIC_API_KEY=test-key node dist/bin/muv.js` starts successfully and shows onboarding prompts (wallet setup + personality selection) when no wallet exists.

## AC Verification Summary
- **AC-1:** PASS — `tsc` completes with 0 errors, `dist/` has all compiled files
- **AC-2:** PASS — Binary starts, shows onboarding when no wallet exists
- **AC-3:** Token registry has 55 entries (28 core + 20 Canopy vault + 7 IPX LP) — see Known Issues
- **AC-4:** PASS — 5 tools defined: `get_balances`, `get_token_balance`, `swap_tokens`, `transfer_tokens`, `get_positions` with proper `input_schema`
- **AC-5:** PASS — `swap_tokens` handler calls `buildSwapPayload` which dispatches to `buildAmmSwapPayload` (default) or `buildClammSwapPayload` (when `use_clamm` is true). AMM calls `{AMM}::pool::swap_exact_in_{poolType}_entry`, CLAMM calls `{CLAMM}::scripts::swap`
- **AC-6:** PASS — `transfer_tokens` uses `0x1::aptos_account::transfer` for MOVE (faAddress `0x...0a`) and `0x1::primary_fungible_store::transfer` for other fungible assets
- **AC-7:** PASS — Both swap and transfer handlers call `simulateTransaction` for gas estimate, then `confirmTransaction` which prints preview and waits for y/n
- **AC-8:** PASS — `ConversationManager.processInput()` maintains `messages: MessageParam[]` history and loops on `stop_reason === "tool_use"`
- **AC-9:** PASS — `getSystemPrompt()` includes full token list, wallet address, and adapts style based on personality ("terse" or "friendly")
- **AC-10:** PASS — `client.ts` uses `Network.CUSTOM`, fullnode `https://mainnet.movementnetwork.xyz/v1`, indexer `https://indexer.mainnet.movementnetwork.xyz/v1/graphql`

## Decisions
- Used `Anthropic.MessageParam` etc. namespace types instead of deep SDK path imports — this is the recommended pattern for `@anthropic-ai/sdk` v0.39+ and avoids runtime module resolution issues
- Left the existing `confirmTransaction` stdin implementation as-is since it works in the REPL context (type-only imports are erased, so the readline/stdin conflict is manageable)

## Known Issues
- **Token count mismatch:** Spec says 54 tokens (27 core + 20 Canopy + 7 IPX LP) but registry has 55 (28 core + 20 Canopy + 7 IPX LP). There is one extra core token. Per spec constraint "Do NOT change any token addresses or decimals in the registry", the registry was left as-is. No addresses are fabricated.
- **stdin conflict (spec Known Issue #2):** `confirmTransaction` reads from `process.stdin` via `.once("data")` while `readline.Interface` in `index.ts` also owns stdin. This could cause missed input in edge cases. For v1 this is acceptable since readline pauses during async tool execution.
- **Conversation memory growth (spec Known Issue #3):** `ConversationManager` accumulates all messages without limit. Acceptable for v1 but could hit token limits in long sessions.
