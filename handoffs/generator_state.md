# Generator State — Iteration 1

## Changes Made
- `src/server.ts`: Created MCP server with McpServer + StdioServerTransport, registered 5 tools (get_balances, get_token_balance, swap_tokens, transfer_tokens, get_positions) with zod schemas and JSON responses. All handlers use try/catch returning structured error JSON.
- `src/bin/muv.ts`: Replaced REPL startup with `startServer()` import from `../server.js`. Preserved shebang.
- `src/wallet.ts`: Simplified to single `accountFromPrivateKey(privateKeyHex: string): Account` utility function.
- `muv-mcp.json`: Created MCP config file at project root with `{"mcpServers":{"muv":{"command":"node","args":["dist/bin/muv.js"]}}}`.
- `package.json`: Swapped `@anthropic-ai/sdk` for `@modelcontextprotocol/sdk` + `zod`, updated description.
- Deleted: `src/ai/client.ts`, `src/ai/intent.ts`, `src/ai/prompts.ts`, `src/index.ts`, `src/ui/confirm.ts`, `src/config.ts`

## Commits
- `e52c4ee` — feat: add MCP server with 5 Movement blockchain tools
- `c55c4db` — refactor: update entry point and wallet for MCP server
- `f59a4d1` — chore: remove AI/REPL code and interactive UI
- `6513032` — chore: swap @anthropic-ai/sdk for @modelcontextprotocol/sdk and zod

## Build Status
PASS — `npx tsc` completes with zero errors.

## Decisions
- Kept `src/ui/display.ts` as it has no interactive I/O and is harmless to retain.
- `src/config.ts` was fully deleted since nothing depends on `getConfigDir()` after wallet.ts simplification.
- Tool handlers return `{ content: [{ type: "text", text: JSON.stringify(data) }] }` for all responses.
- Error responses use `{ error: true, message: string }` format per spec.
- The `swap_tokens` and `transfer_tokens` tools accept `private_key` per-request and use `accountFromPrivateKey()` to construct accounts for signing.

## Known Issues
- None identified. All acceptance criteria should be met.
