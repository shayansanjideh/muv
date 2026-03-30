# Generator State — Iteration 1

## Changes Made
- `src/chain/balance.ts`: Three fixes applied:
  1. Added `normalizeAddress(addr: string): string` utility (exported) that zero-pads any `0x`-prefixed hex to 66 chars (`"0x" + hex.padStart(64, "0")`).
  2. Rewrote `getBalance` to call `aptosClient.viewJson<[string]>()` with the Move view function `0x1::primary_fungible_store::balance` instead of the indexer. Removed the `try/catch` wrapper so errors propagate to `server.ts`.
  3. Fixed `getAllBalances`: changed `amount: { _gt: "0" }` to `amount: { _gt: 0 }` (numeric), and changed the `TOKEN_REGISTRY.find()` comparison to use `normalizeAddress()` on both sides so short-form indexer addresses (e.g. `"0xa"`) match long-form registry entries.

## Commits
- `b29d098` — feat: fix balance checking using view function and address normalization

## Build Status
PASS (tsc exits 0, no errors)

## Decisions
- `normalizeAddress` is exported from `balance.ts` (not a separate utils file) to keep the change minimal and avoid creating new files unnecessarily.
- The `try/catch` in `getBalance` was fully removed (not just rethrown) since `server.ts` already wraps calls in `try/catch` that returns `errorResponse()`.
- `getAllBalances` keeps its existing `try/catch` and rethrows as before — only the indexer query filter and address comparison were changed.

## Known Issues
- None
