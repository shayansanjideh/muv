All acceptance criteria verified. Here is my evaluation:

# Evaluation — Iteration 1

## VERDICT: PASS

## Build Status
**PASS** — `npm run build` (`tsc`) completes with zero errors and no warnings.

## Acceptance Criteria

### AC-1: Running `npx tsc` (or `npm run build`) completes with zero errors.
**Status:** PASS
**Evidence:** `npm run build` exits 0 with clean output `> muv@0.1.0 build > tsc`.

### AC-2: `package.json` lists `@modelcontextprotocol/sdk` as a dependency and does NOT list `@anthropic-ai/sdk`.
**Status:** PASS
**Evidence:** `package.json:19` has `"@modelcontextprotocol/sdk": "^1.12.1"` and `"zod": "^3.23.0"`. No `@anthropic-ai/sdk` present anywhere in dependencies.

### AC-3: The files `src/ai/client.ts`, `src/ai/intent.ts`, `src/ai/prompts.ts` do not exist.
**Status:** PASS
**Evidence:** `ls` confirms all three files do not exist (`No such file or directory`).

### AC-4: `src/server.ts` exists and exports a `startServer()` function that creates a `McpServer` instance and connects it to a `StdioServerTransport`.
**Status:** PASS
**Evidence:** `src/server.ts:22` exports `async function startServer()`. Line 23 creates `new McpServer({ name: "muv", version: "0.1.0" })`. Line 186-187 creates `new StdioServerTransport()` and calls `await server.connect(transport)`.

### AC-5: `src/server.ts` registers exactly 5 tools: `get_balances`, `get_token_balance`, `swap_tokens`, `transfer_tokens`, `get_positions`.
**Status:** PASS
**Evidence:** Five `server.tool()` calls at lines 26 (`get_balances`), 49 (`get_token_balance`), 76 (`swap_tokens`), 131 (`transfer_tokens`), 165 (`get_positions`). No other tool registrations.

### AC-6: The `get_balances` tool schema requires `wallet_address` (string) as input.
**Status:** PASS
**Evidence:** `src/server.ts:29` — `{ wallet_address: z.string().describe("The wallet address to check balances for (0x...)") }`.

### AC-7: The `swap_tokens` tool schema requires `private_key`, `from_token`, `to_token`, `amount`, `pool_address` as input parameters.
**Status:** PASS
**Evidence:** `src/server.ts:80-84` — All five required params present as `z.string()`. Optional params (`use_clamm`, `slippage_bps`, `amm_pool_type`, `expected_output`, `zero_for_one`) correctly use `.optional()`.

### AC-8: The `transfer_tokens` tool schema requires `private_key`, `token_symbol`, `recipient`, `amount` as input parameters.
**Status:** PASS
**Evidence:** `src/server.ts:135-138` — All four params present as `z.string()`.

### AC-9: The `get_positions` tool schema requires `wallet_address` (string) as input.
**Status:** PASS
**Evidence:** `src/server.ts:168` — `{ wallet_address: z.string().describe("The wallet address to check positions for (0x...)") }`.

### AC-10: `src/bin/muv.ts` imports from `../server.js` and calls `startServer()`.
**Status:** PASS
**Evidence:** `src/bin/muv.ts:2` — `import { startServer } from "../server.js";`. Line 4 calls `startServer().catch(...)`.

### AC-11: `src/ui/confirm.ts` does not exist.
**Status:** PASS
**Evidence:** `ls` confirms file does not exist.

### AC-12: `src/index.ts` either does not exist or does not contain REPL logic.
**Status:** PASS
**Evidence:** `src/index.ts` does not exist (deleted).

### AC-13: `muv-mcp.json` exists at project root with correct content.
**Status:** PASS
**Evidence:** File contains exactly `{"mcpServers":{"muv":{"command":"node","args":["dist/bin/muv.js"]}}}`.

### AC-14: `src/data/tokens.ts` is unchanged.
**Status:** PASS
**Evidence:** `git diff symphony/muv-cli -- src/data/tokens.ts` produces no output (zero diff).

### AC-15: `src/chain/client.ts`, `src/chain/balance.ts`, `src/chain/transfer.ts`, `src/chain/transactions.ts` still exist and retain their core functions.
**Status:** PASS
**Evidence:** All four files confirmed to exist via `ls`. No modifications in the diff (`git diff --name-status` does not list them as modified).

### AC-16: `src/protocols/meridian/swap.ts`, `src/protocols/meridian/pool.ts`, `src/protocols/meridian/farming.ts` still exist and retain their core functions.
**Status:** PASS
**Evidence:** All three files confirmed to exist via `ls`. No modifications in the diff.

## Code Quality
**Status:** PASS
**Issues:** None identified.
- All tool handlers have proper try/catch with structured error responses.
- No `console.log` in server code (stdout reserved for MCP protocol).
- ESM `.js` import extensions used consistently.
- `wallet.ts` properly cleaned to a single utility function with correct `0x` prefix handling.
- No dead code, no broken imports, no type errors.

## Completeness
**Status:** PASS
**Gaps:** None. All specified files created, deleted, and modified per spec.

## Summary
The implementation cleanly converts muv from a REPL CLI to an MCP server. All 16 acceptance criteria pass with specific evidence. The build compiles without errors, all AI/REPL code is removed, the 5 MCP tools are properly registered with correct schemas, chain/protocol files are preserved untouched, and the code follows proper error handling patterns.
