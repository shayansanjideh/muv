# Feature Specification: MCP Server Wallet Auto-Detection

## Overview

The `muv` MCP server exposes blockchain tools to Claude Code over stdio. Currently the compiled server (`dist/server.js`) requires `wallet_address` as a mandatory parameter on `get_balances`, `get_token_balance`, and `get_positions`, causing Claude to ask the user for their address even though it is already stored in `~/.config/muv/wallet.json`. The fix is to make `wallet_address` optional in those three tools, add a `getWalletAddress(provided?)` helper that falls back to `wallet.json`, add a `get_wallet_info` tool, and rebuild the TypeScript so the compiled `dist/` reflects the changes.

## Scope

### In Scope
- Implement `getWalletAddress(provided?: string)` helper function in `/root/muv/src/server.ts`
- Make `wallet_address` optional (`.optional()`) in the Zod schemas for `get_balances`, `get_token_balance`, and `get_positions` in `/root/muv/src/server.ts`
- Update the tool handler bodies for those three tools to call `getWalletAddress(wallet_address)` instead of using `wallet_address` directly
- Add a `get_wallet_info` tool (no parameters) that returns the configured wallet address
- Update tool descriptions to indicate wallet address is auto-detected from config
- Run `npm run build` in `/root/muv` so `dist/server.js` reflects all changes

### Out of Scope
- Changes to `swap_tokens` or `transfer_tokens` (these already work correctly without wallet_address)
- Changes to `src/wallet.ts`, `src/config.ts`, or any file other than `src/server.ts`
- Changes to the CLI mode or interactive prompts
- Any wallet creation or key management logic

## Functional Requirements

1. `getWalletAddress(provided?: string): string` — When `provided` is a non-empty string, return it unchanged. When `provided` is `undefined` or an empty string, call `loadWallet()` and return `wallet.address`. If `loadWallet()` returns `null` or `wallet.address` is absent, throw `new Error("No wallet configured. Run \`muv\` to set up your wallet first.")`.
2. `get_balances` Zod schema must have `wallet_address: z.string().optional().describe("Wallet address (0x...). Omit to use the configured wallet.")`. The handler must use `AccountAddress.fromString(getWalletAddress(wallet_address))`.
3. `get_token_balance` Zod schema must have `wallet_address: z.string().optional()`. The handler must use `AccountAddress.fromString(getWalletAddress(wallet_address))`.
4. `get_positions` Zod schema must have `wallet_address: z.string().optional()`. The handler must call `getWalletAddress(wallet_address)` and pass the result to `getUserPositions` and `getUserFarmingPositions`.
5. A new tool `get_wallet_info` with empty parameter schema `{}` and description `"Get the configured wallet address. Call this first to know the user's wallet — do NOT ask the user for their address."` must return `jsonResponse({ wallet_address: address })`.
6. After all source changes, `npm run build` must succeed (exit code 0) inside `/root/muv`.
7. `dist/server.js` must no longer contain `z.string().describe("The wallet address to check balances for` (the old mandatory pattern).

## Non-Functional Requirements

- Must not break the existing `getPrivateKey()` function or any transaction tools (`swap_tokens`, `transfer_tokens`).
- Build must succeed with zero TypeScript errors.
- The MCP server is invoked via `node dist/bin/muv.js --mcp` — only `dist/` matters at runtime; source changes alone are insufficient.

## Acceptance Criteria

- **AC-1:** `src/server.ts` contains a function `getWalletAddress` that accepts an optional string parameter and calls `loadWallet()` when the parameter is absent.
- **AC-2:** In `src/server.ts`, the Zod schema for `get_balances` uses `z.string().optional()` for `wallet_address` (not `z.string()` alone).
- **AC-3:** In `src/server.ts`, the Zod schema for `get_token_balance` uses `z.string().optional()` for `wallet_address`.
- **AC-4:** In `src/server.ts`, the Zod schema for `get_positions` uses `z.string().optional()` for `wallet_address`.
- **AC-5:** `src/server.ts` registers a tool named `get_wallet_info` with an empty parameter schema (`{}`).
- **AC-6:** Running `npm run build` in `/root/muv` exits with code 0 and produces no TypeScript errors.
- **AC-7:** `dist/server.js` contains the string `get_wallet_info` (confirming the new tool was compiled in).
- **AC-8:** `dist/server.js` does NOT contain the string `z.string().describe("The wallet address to check balances for` (confirming the old mandatory schema is gone).
- **AC-9:** `dist/server.js` contains `wallet_address` in a context paired with `.optional()` for each of the three read tools.

## Technical Context

- **Project root:** `/root/muv`
- **Source file to modify:** `/root/muv/src/server.ts` (the only file that needs editing)
- **Compiled output:** `/root/muv/dist/server.js` (must be rebuilt with `npm run build`)
- **Build command:** `npm run build` runs `tsc` per `/root/muv/package.json`; tsconfig compiles `src/**/*` into `dist/`, ES2022, Node16 module resolution
- **MCP entrypoint:** `node dist/bin/muv.js --mcp` (via `/root/muv/muv-mcp.json`); the bin imports `../server.js` when `--mcp` flag is present
- **Wallet file location:** `~/.config/muv/wallet.json` (resolved by `getConfigDir()` in `src/config.ts`, respects `MUV_CONFIG_DIR` env var)
- **WalletData interface** (from `src/wallet.ts`):
  ```ts
  export interface WalletData {
    address: string;   // e.g. "0xabc123..."
    privateKey: string; // hex, without 0x prefix
  }
  ```
- **`loadWallet()` signature:** `loadWallet(): WalletData | null` — returns `null` when `wallet.json` does not exist; imported from `./wallet.js` (already imported in server.ts)
- **`jsonResponse` / `errorResponse`:** Already defined in `src/server.ts`; use them for the `get_wallet_info` handler
- **Key patterns:** All tools use `server.tool(name, description, zodSchema, async handler)` from `@modelcontextprotocol/sdk`; handlers return `jsonResponse(...)` or `errorResponse(...)`

## Implementation Hints

**IMPORTANT — The source file `src/server.ts` already contains the complete correct implementation.** A prior edit added `getWalletAddress`, made `wallet_address` optional, and added `get_wallet_info`. The compiled output `dist/server.js` has NOT been rebuilt and still reflects the old mandatory-address behavior.

The Generator's job is therefore:

1. **Verify** that `src/server.ts` already has the correct implementation by reading it and confirming all ACs for source are met.
2. **If any source AC is not met**, apply the minimal edits to `src/server.ts` to satisfy it (use the exact code patterns described below).
3. **Run `npm run build`** in `/root/muv` to recompile.
4. **Verify** the compiled `dist/server.js` satisfies the dist ACs.

**Exact code to ensure is in `src/server.ts` (if not already present):**

```ts
// Helper — place before startServer()
function getWalletAddress(provided?: string): string {
  if (provided) return provided;
  const wallet = loadWallet();
  if (wallet?.address) return wallet.address;
  throw new Error("No wallet configured. Run `muv` to set up your wallet first.");
}
```

```ts
// get_wallet_info tool — register before get_balances
server.tool(
  "get_wallet_info",
  "Get the configured wallet address. Call this first to know the user's wallet — do NOT ask the user for their address.",
  {},
  async () => {
    try {
      const address = getWalletAddress();
      return jsonResponse({ wallet_address: address });
    } catch (error) {
      return errorResponse(String(error));
    }
  }
);
```

```ts
// get_balances schema (wallet_address must be optional)
{ wallet_address: z.string().optional().describe("Wallet address (0x...). Omit to use the configured wallet.") }
// handler: const address = AccountAddress.fromString(getWalletAddress(wallet_address));
```

```ts
// get_token_balance schema
{ wallet_address: z.string().optional().describe("Wallet address (0x...). Omit to use the configured wallet."), token_symbol: z.string().describe("...") }
// handler: const address = AccountAddress.fromString(getWalletAddress(wallet_address));
```

```ts
// get_positions schema
{ wallet_address: z.string().optional().describe("Wallet address (0x...). Omit to use the configured wallet.") }
// handler: const addr = getWalletAddress(wallet_address);
```