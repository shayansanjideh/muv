# Feature Specification: Refactor muv from REPL CLI to MCP Server

## Overview
Convert muv from a standalone REPL CLI with an embedded Claude API client into an MCP (Model Context Protocol) server using `@modelcontextprotocol/sdk`. The server exposes Movement blockchain tools over stdio transport, making muv agent-agnostic — usable with Claude Code, Cursor, Windsurf, or any MCP-compatible client. No Anthropic API key is needed by end users.

## Scope

### In Scope
- Create MCP server entry point with stdio transport using `@modelcontextprotocol/sdk`
- Register 5 existing tools as MCP tools with JSON Schema input definitions
- Adapt tool handlers to accept `wallet_address` / `private_key` per-request (instead of reading from stored config)
- Write tools (swap, transfer) sign+submit transactions using the provided private key
- Remove all AI/REPL code (`src/ai/*`, `src/index.ts` REPL, `src/ui/confirm.ts`)
- Simplify `src/config.ts` and `src/wallet.ts` (remove stored state)
- Update `package.json` (swap `@anthropic-ai/sdk` for `@modelcontextprotocol/sdk`)
- Create `muv-mcp.json` config file for easy MCP client integration

### Out of Scope
- Adding new tools beyond the existing 5
- HTTP/SSE transport (stdio only)
- MCP resources or prompts (tools only)
- Token registry changes
- Meridian contract address changes
- Any blockchain logic changes

## Functional Requirements

1. **MCP Server Initialization**: `src/server.ts` creates a `McpServer` (from `@modelcontextprotocol/sdk/server/mcp.js`) with name `"muv"` and version `"0.1.0"`, connects via `StdioServerTransport` (from `@modelcontextprotocol/sdk/server/stdio.js`).

2. **Tool: `get_balances`** — Accepts `{ wallet_address: string }`. Returns JSON `{ balances: [{ symbol, name, balance, faAddress }] }` for all non-zero token balances. Uses `getAllBalances()` from `src/chain/balance.ts`.

3. **Tool: `get_token_balance`** — Accepts `{ wallet_address: string, token_symbol: string }`. Returns JSON `{ symbol, name, balance, faAddress }` for a single token. Uses `getBalance()` from `src/chain/balance.ts`.

4. **Tool: `swap_tokens`** — Accepts `{ private_key, from_token, to_token, amount, pool_address, use_clamm?, slippage_bps?, amm_pool_type?, expected_output?, zero_for_one? }`. Builds swap payload via `buildSwapPayload()`, signs and submits via `buildAndSubmitTransaction()`, returns JSON `{ success, tx_hash, details }`. The private key is used to construct an `Account` object for signing.

5. **Tool: `transfer_tokens`** — Accepts `{ private_key, token_symbol, recipient, amount }`. Builds transfer payload via `buildTransferPayload()`, signs and submits, returns JSON `{ success, tx_hash, details }`.

6. **Tool: `get_positions`** — Accepts `{ wallet_address: string }`. Returns JSON `{ lp_positions: [...], farming_positions: [...] }` using `getUserPositions()` and `getUserFarmingPositions()` from `src/protocols/meridian/`.

7. **Error Handling**: All tool handlers wrap execution in try/catch and return structured JSON errors: `{ error: true, message: string }`. The MCP server itself never crashes on tool errors.

8. **Entry Point**: `src/bin/muv.ts` imports and calls a `startServer()` function from `src/server.ts`. The shebang `#!/usr/bin/env node` is preserved.

9. **MCP Config File**: `muv-mcp.json` at project root contains the MCP server configuration pointing to `dist/bin/muv.js`.

## Non-Functional Requirements
- No user interaction (stdin prompts) in the server — all communication via MCP protocol over stdio
- Server must not write to stdout except via MCP protocol (no `console.log`; use `console.error` for debug logging if needed)
- All tool responses are valid JSON strings
- Startup time < 2 seconds (no heavy initialization blocking)

## Acceptance Criteria

- **AC-1:** Running `npx tsc` (or `npm run build`) completes with zero errors.
- **AC-2:** `package.json` lists `@modelcontextprotocol/sdk` as a dependency and does NOT list `@anthropic-ai/sdk`.
- **AC-3:** The files `src/ai/client.ts`, `src/ai/intent.ts`, `src/ai/prompts.ts` do not exist.
- **AC-4:** `src/server.ts` exists and exports a `startServer()` function that creates a `McpServer` instance and connects it to a `StdioServerTransport`.
- **AC-5:** `src/server.ts` registers exactly 5 tools: `get_balances`, `get_token_balance`, `swap_tokens`, `transfer_tokens`, `get_positions`.
- **AC-6:** The `get_balances` tool schema requires `wallet_address` (string) as input.
- **AC-7:** The `swap_tokens` tool schema requires `private_key`, `from_token`, `to_token`, `amount`, `pool_address` as input parameters.
- **AC-8:** The `transfer_tokens` tool schema requires `private_key`, `token_symbol`, `recipient`, `amount` as input parameters.
- **AC-9:** The `get_positions` tool schema requires `wallet_address` (string) as input.
- **AC-10:** `src/bin/muv.ts` imports from `../server.js` and calls `startServer()`.
- **AC-11:** `src/ui/confirm.ts` does not exist (no interactive confirmation in MCP server).
- **AC-12:** `src/index.ts` either does not exist or does not contain REPL logic (no `readline`, no `startRepl`).
- **AC-13:** `muv-mcp.json` exists at project root with content `{"mcpServers":{"muv":{"command":"node","args":["dist/bin/muv.js"]}}}`.
- **AC-14:** `src/data/tokens.ts` is unchanged (all 54 tokens preserved with exact addresses).
- **AC-15:** `src/chain/client.ts`, `src/chain/balance.ts`, `src/chain/transfer.ts`, `src/chain/transactions.ts` still exist and retain their core functions.
- **AC-16:** `src/protocols/meridian/swap.ts` and `src/protocols/meridian/pool.ts` and `src/protocols/meridian/farming.ts` still exist and retain their core functions.

## Technical Context

### Project Structure
```
src/
├── bin/muv.ts          — Entry point (currently starts REPL, needs to start MCP server)
├── index.ts            — REPL logic (TO REMOVE)
├── config.ts           — Config with API key, personality (TO SIMPLIFY/REMOVE)
├── wallet.ts           — Wallet storage (TO SIMPLIFY — make per-request utility)
├── ai/                 — Claude API integration (TO REMOVE entirely)
│   ├── client.ts
│   ├── intent.ts
│   └── prompts.ts
├── chain/              — Blockchain interaction (KEEP)
│   ├── client.ts       — Aptos SDK client, RPC: https://mainnet.movementnetwork.xyz/v1
│   ├── balance.ts      — getAllBalances(address: AccountAddress), getBalance(address, tokenAddr)
│   ├── transfer.ts     — buildTransferPayload(token, recipient, amount)
│   └── transactions.ts — buildAndSubmitTransaction(sender: Account, payload), simulateTransaction(sender, payload)
├── data/
│   └── tokens.ts       — TOKEN_REGISTRY (54 tokens), findToken(), formatTokenAmount(), parseTokenAmount()
├── protocols/meridian/
│   ├── swap.ts         — buildSwapPayload(params: SwapParams), buildAmmSwapPayload(), buildClammSwapPayload()
│   ├── pool.ts         — getUserPositions(userAddress: string)
│   └── farming.ts      — getUserFarmingPositions(userAddress: string)
└── ui/
    ├── display.ts      — displayBalances(), displayError(), displaySuccess() (CAN KEEP for formatting)
    └── confirm.ts      — confirmTransaction() interactive prompt (TO REMOVE)
```

### Key Patterns

- **TypeScript ESM**: Project uses `"type": "module"` in package.json, `"module": "Node16"` in tsconfig. All imports use `.js` extensions (e.g., `import { foo } from "./bar.js"`).
- **Aptos SDK**: Uses `@aptos-labs/ts-sdk` v1.33.1. Key types: `Account`, `Ed25519PrivateKey`, `AccountAddress`, `InputGenerateTransactionPayloadData`, `HexInput`.
- **Account from private key**: `const privateKey = new Ed25519PrivateKey(keyHex as HexInput); const account = Account.fromPrivateKey({ privateKey });` (see `src/wallet.ts` lines 43-48, 60-62).
- **Balance queries**: Accept `AccountAddress` objects. Create via `AccountAddress.fromString(addressStr)`.
- **Position queries**: Accept raw string addresses (`getUserPositions(userAddress: string)`).
- **Tool schemas**: Currently defined as Anthropic `Tool[]` in `src/ai/intent.ts` lines 22-129. MCP tool schemas use identical JSON Schema format (`zod` schemas or raw objects).

### MCP SDK API (from `@modelcontextprotocol/sdk`)

The `McpServer` class from `@modelcontextprotocol/sdk/server/mcp.js`:
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "muv", version: "0.1.0" });

server.tool("tool_name", "description", { param: z.string() }, async (args) => {
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

**IMPORTANT**: The `@modelcontextprotocol/sdk` package re-exports `zod` as a peer dependency. The Generator must add `zod` as a dependency in `package.json` as well.

### Dependencies
- **ADD**: `@modelcontextprotocol/sdk` (latest, e.g., `^1.12.1`), `zod` (e.g., `^3.23.0`)
- **REMOVE**: `@anthropic-ai/sdk`
- **KEEP**: `@aptos-labs/ts-sdk` `^1.33.1`

### Files to Create
1. `src/server.ts` — MCP server setup, tool registration, all 5 tool handlers
2. `muv-mcp.json` — MCP config for clients

### Files to Delete
1. `src/ai/client.ts`
2. `src/ai/intent.ts`
3. `src/ai/prompts.ts`
4. `src/index.ts`
5. `src/ui/confirm.ts`

### Files to Modify
1. `src/bin/muv.ts` — Replace REPL start with MCP server start
2. `package.json` — Swap deps, update description
3. `src/config.ts` — Remove or gut (remove `getAnthropicApiKey`, `MuvConfig`, personality). Can be deleted entirely if no other module depends on `getConfigDir()`. **Note**: `src/wallet.ts` imports `getConfigDir` from `src/config.ts` (line 2). If wallet.ts is simplified to not use file storage, config.ts can be fully removed.
4. `src/wallet.ts` — Simplify to only export a utility function `accountFromPrivateKey(privateKeyHex: string): Account` (no file I/O). The stored wallet pattern is replaced by per-request private_key parameters.

### Constraints
- `src/data/tokens.ts` must NOT be modified (54 tokens, exact addresses)
- `src/chain/*` files should remain functionally identical
- `src/protocols/meridian/*` files should remain functionally identical
- No `console.log` in the server — stdout is the MCP transport channel
- All `.js` import extensions must be preserved for ESM compatibility

## Implementation Hints

1. **Start with `src/server.ts`**: Create the MCP server and register all 5 tools. The tool handler logic can be adapted from `handleToolCall()` in `src/ai/intent.ts` (lines 131-257) — same switch/case structure but with per-request wallet/account creation and JSON responses.

2. **Wallet utility**: Create a simple helper in `src/wallet.ts` (or inline in `server.ts`):
   ```typescript
   export function accountFromPrivateKey(privateKeyHex: string): Account {
     const cleaned = privateKeyHex.startsWith("0x") ? privateKeyHex : `0x${privateKeyHex}`;
     const privateKey = new Ed25519PrivateKey(cleaned as HexInput);
     return Account.fromPrivateKey({ privateKey });
   }
   ```

3. **Tool response format**: All tools should return `{ content: [{ type: "text", text: JSON.stringify(data) }] }` where `data` is the structured JSON result.

4. **Error handling pattern**:
   ```typescript
   try {
     // ... tool logic
     return { content: [{ type: "text", text: JSON.stringify({ success: true, ...data }) }] };
   } catch (error) {
     return { content: [{ type: "text", text: JSON.stringify({ error: true, message: String(error) }) }] };
   }
   ```

5. **Cleanup order**: First create `src/server.ts` and update `src/bin/muv.ts`, then delete removed files, then update `package.json`. This ensures the build never breaks mid-refactor.

6. **Keep `src/ui/display.ts`**: It has no interactive I/O and its formatting functions may be useful. Not strictly required but harmless to retain.