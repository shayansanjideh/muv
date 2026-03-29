# Feature Specification: muv — Natural Language CLI for Movement Blockchain

## Overview
muv is a TypeScript CLI tool that lets end users interact with the Movement blockchain (Aptos fork, chain ID 126) using plain English. Users type natural language commands like "swap 10 USDC.e for MOVE" or "what's my balance?" and muv translates intent into on-chain actions using Claude API tool calling. The project already has a complete codebase scaffold — this spec defines the acceptance criteria and identifies issues that must be fixed for the tool to compile and run correctly.

## Scope

### In Scope
- CLI binary (`muv`) with interactive REPL
- First-run onboarding: wallet import/generate + personality selection
- Claude API integration with tool_use for intent mapping
- Token balance queries (all tokens and per-token)
- Token transfers (MOVE native + fungible assets)
- Meridian DEX swaps (AMM with stable/weighted/metastable pool types, and CLAMM)
- Meridian LP/farming position queries
- Mandatory transaction confirmation before any on-chain submission
- Hardcoded token registry with all specified tokens (27 core + 20 Canopy vault + 7 IPX LP = 54 total)
- Correct TypeScript compilation (`npm run build` succeeds with zero errors)

### Out of Scope
- Testnet/devnet support (mainnet only)
- Mnemonic/BIP39 wallet import (private key hex only for v1)
- Price oracle integration (no real price feeds — AI can note this limitation)
- Transaction history queries (would require indexer pagination — deferred)
- LP deposit/withdraw transactions (read-only position queries only)
- Farming stake/unstake/claim execution from NL (farming.ts has builders but they are not wired as AI tools)
- Web UI or any non-CLI interface

## Functional Requirements

1. **Binary Entry Point**: Running `npx muv` or `node dist/bin/muv.js` starts the application. The `bin/muv.ts` file has a shebang (`#!/usr/bin/env node`) and invokes `startRepl()`.

2. **First-Run Onboarding**: If `~/.config/muv/wallet.json` or `~/.config/muv/config.json` does not exist, the REPL enters onboarding flow:
   - Prompt user to choose: (1) Import existing private key, (2) Generate new wallet
   - Import accepts a hex private key (with or without `0x` prefix), derives the Ed25519 account, saves to `~/.config/muv/wallet.json`
   - Generate creates a new `Account.generate()`, saves private key + address to wallet.json
   - Prompt user to choose personality: (1) Terse, (2) Friendly — saves to `~/.config/muv/config.json`

3. **REPL Loop**: After onboarding, displays `muv>` prompt. User types natural language. Exit with `exit`, `quit`, `q`, or `.exit`.

4. **AI Intent Parsing**: Each user input is sent to Claude API (`claude-sonnet-4-20250514`) with:
   - A system prompt containing the wallet address, personality style, full token registry, and behavioral rules
   - Five tools: `get_balances`, `get_token_balance`, `swap_tokens`, `transfer_tokens`, `get_positions`
   - A conversation history (`MessageParam[]`) for multi-turn context
   - A tool-use loop that continues calling tools until the model returns a text response

5. **Balance Queries**: `get_balances` returns all non-zero fungible asset balances for the user's address via `aptosClient.getCurrentFungibleAssetBalances`. `get_token_balance` returns a single token's balance.

6. **Token Transfers**: `transfer_tokens` builds a payload using either `0x1::aptos_account::transfer` (for native MOVE) or `0x1::primary_fungible_store::transfer` (for fungible assets), simulates for gas estimate, shows confirmation, then submits.

7. **Meridian Swaps**: `swap_tokens` supports:
   - **AMM**: Calls `{MERIDIAN_AMM}::pool::swap_exact_in_{poolType}_entry` with args `(pool_object, from_metadata, amount, to_metadata, min_output)`. Pool types: stable, weighted, metastable.
   - **CLAMM**: Calls `{MERIDIAN_CLAMM}::scripts::swap` with args `(pool_object, amount, min_output, sqrt_price_limit, zero_for_one, exact_input, partner_string)`.
   - Both require `pool_address` (the on-chain pool object address). The AI must be instructed to ask the user or note that pool addresses are needed.
   - Slippage defaults to 50 bps (0.5%). `min_output` is calculated as `expectedOutput * (10000 - slippageBps) / 10000`.

8. **Position Queries**: `get_positions` scans user's account resources for LP position and farming position resource types.

9. **Transaction Confirmation**: Before every write transaction (swap, transfer), the system must:
   - Simulate the transaction to get gas estimate
   - Display a preview showing action, amounts, gas estimate
   - Wait for user to type `y`/`yes` or `n`/`no`
   - Only submit if confirmed

10. **Token Registry**: `src/data/tokens.ts` exports `TOKEN_REGISTRY: TokenInfo[]` with exactly 54 entries. `findToken(query)` does case-insensitive match on symbol or name. `findTokenByAddress(address)` does case-insensitive match on faAddress.

## Non-Functional Requirements
- **TypeScript strict mode**: `tsconfig.json` has `"strict": true`. All code must compile with zero errors under `tsc`.
- **ES Modules**: Project uses `"type": "module"` in package.json and `"module": "Node16"` in tsconfig. All local imports must use `.js` extension.
- **No external runtime dependencies** beyond `@anthropic-ai/sdk` and `@aptos-labs/ts-sdk` (plus their transitive deps).
- **API Key**: Read from `ANTHROPIC_API_KEY` env var or `config.json`. Exit with clear error if missing.
- **Mainnet only**: RPC hardcoded to `https://mainnet.movementnetwork.xyz/v1`, indexer to `https://indexer.mainnet.movementnetwork.xyz/v1/graphql`.

## Acceptance Criteria

Each criterion is independently verifiable:

- **AC-1:** `npm run build` (i.e., `tsc`) completes with exit code 0 and zero errors. The `dist/` directory contains compiled `.js` and `.d.ts` files for all source files.

- **AC-2:** `node dist/bin/muv.js` starts without crashing (given `ANTHROPIC_API_KEY` is set). If no wallet exists, it prints the onboarding prompts. If wallet exists, it shows `muv ready. Wallet: <address>` and the `muv>` prompt.

- **AC-3:** The file `src/data/tokens.ts` exports a `TOKEN_REGISTRY` array containing all 54 tokens listed in the requirements (27 core tokens + 20 Canopy vault tokens + 7 IPX LP tokens) with exactly the `faAddress` and `decimals` values specified. No token addresses are fabricated.

- **AC-4:** `src/ai/intent.ts` defines exactly 5 tools (`get_balances`, `get_token_balance`, `swap_tokens`, `transfer_tokens`, `get_positions`) with proper `input_schema` definitions that the Claude API accepts.

- **AC-5:** The `swap_tokens` tool handler calls `buildSwapPayload` which dispatches to `buildAmmSwapPayload` (default) or `buildClammSwapPayload` (when `use_clamm` is true). AMM swap calls `{AMM_ADDRESS}::pool::swap_exact_in_{poolType}_entry`. CLAMM swap calls `{CLAMM_ADDRESS}::scripts::swap`.

- **AC-6:** The `transfer_tokens` tool handler uses `0x1::aptos_account::transfer` for native MOVE and `0x1::primary_fungible_store::transfer` for other fungible assets.

- **AC-7:** Every write transaction (swap, transfer) calls `simulateTransaction` for gas estimate, then calls `confirmTransaction` which prints a preview and waits for `y`/`n` input before proceeding. If the user types anything other than `y`/`yes`, the transaction is cancelled.

- **AC-8:** The `ConversationManager` class maintains conversation history across turns and loops on `stop_reason === "tool_use"` to handle multi-step tool calls within a single user request.

- **AC-9:** The system prompt in `src/ai/prompts.ts` includes the full token list, the user's wallet address, and adapts its style based on personality setting ("terse" or "friendly").

- **AC-10:** The Aptos client in `src/chain/client.ts` is configured with `Network.CUSTOM`, fullnode URL `https://mainnet.movementnetwork.xyz/v1`, and indexer URL `https://indexer.mainnet.movementnetwork.xyz/v1/graphql`.

## Technical Context

### Project Structure (all files already exist)
```
src/
├── index.ts              — REPL loop + onboarding flow
├── config.ts             — MuvConfig type, load/save from ~/.config/muv/config.json
├── wallet.ts             — WalletData type, load/save/generate/import, getAccount/getAddress helpers
├── bin/muv.ts            — Binary entry point (shebang + startRepl())
├── ai/
│   ├── client.ts         — Singleton Anthropic client via getAIClient()
│   ├── prompts.ts        — getSystemPrompt(personality, walletAddress) builds system prompt with token list
│   └── intent.ts         — Tool definitions, handleToolCall dispatcher, ConversationManager class
├── chain/
│   ├── client.ts         — Aptos SDK client configured for Movement mainnet
│   ├── balance.ts        — getBalance(address, tokenAddr), getAllBalances(address)
│   ├── transfer.ts       — buildTransferPayload(token, recipient, amount)
│   └── transactions.ts   — buildAndSubmitTransaction(account, payload), simulateTransaction(account, payload)
├── protocols/meridian/
│   ├── swap.ts           — buildAmmSwapPayload, buildClammSwapPayload, buildSwapPayload
│   ├── pool.ts           — getPoolInfo, getUserPositions
│   └── farming.ts        — getUserFarmingPositions, buildStakePayload, buildUnstakePayload, buildClaimRewardsPayload
├── data/
│   └── tokens.ts         — TokenInfo interface, TOKEN_REGISTRY array (54 tokens), findToken, findTokenByAddress, formatTokenAmount, parseTokenAmount
└── ui/
    ├── display.ts        — displayBalances, displayTransactionPreview, displaySuccess, displayError
    └── confirm.ts        — confirmTransaction (stdin y/n prompt)
```

### Key Patterns
- **ESM with .js extensions**: All imports use `.js` suffix (e.g., `import { foo } from "./bar.js"`)
- **Singleton pattern**: AI client uses lazy singleton via `getAIClient()`
- **Aptos SDK types**: Uses `InputGenerateTransactionPayloadData` for transaction payloads, `Account` for signing, `AccountAddress` for addresses
- **Claude tool_use loop**: `ConversationManager.processInput()` sends messages, checks `stop_reason === "tool_use"`, dispatches tools, collects `ToolResultBlockParam[]`, re-sends until text response
- **Tool results printed immediately**: In the tool loop, `console.log(result)` prints tool output before sending back to Claude — this means the user sees balance tables etc. immediately

### Dependencies
- `@anthropic-ai/sdk` ^0.39.0 — Claude API client, types: `Anthropic`, `MessageParam`, `Tool`, `ContentBlock`, `ToolUseBlock`, `ToolResultBlockParam`
- `@aptos-labs/ts-sdk` ^1.33.1 — Aptos client, types: `Aptos`, `AptosConfig`, `Network`, `Account`, `Ed25519PrivateKey`, `AccountAddress`, `InputGenerateTransactionPayloadData`, `UserTransactionResponse`
- Dev: `typescript` ^5.7.0, `tsx` ^4.19.0, `@types/node` ^22.0.0

### Constraints
- Do NOT change any token addresses or decimals in the registry
- Do NOT add testnet/devnet support
- Do NOT change the Meridian contract addresses
- The `confirmTransaction` function reads from `process.stdin` directly — this works in the REPL context because readline pauses during tool execution
- `package.json` `"bin"` field points to `dist/bin/muv.js` — the source is at `src/bin/muv.ts`

### Known Issues to Verify/Fix
1. **Import path for Anthropic SDK types**: `intent.ts` imports from `@anthropic-ai/sdk/resources/messages.js` — verify this path is valid with SDK v0.39.0. The types `MessageParam`, `Tool`, `ContentBlock`, `ToolUseBlock`, `ToolResultBlockParam` must be importable.
2. **confirmTransaction stdin conflict**: The `confirm.ts` module reads from `process.stdin` using `.once("data", ...)` while `readline.Interface` in `index.ts` also owns stdin. This may cause conflicts. The readline interface may need to be paused before confirmation and resumed after.
3. **Conversation memory growth**: `ConversationManager` accumulates all messages without limit. For v1 this is acceptable but could hit token limits in long sessions.

## Implementation Hints

1. **If TypeScript compilation fails on Anthropic SDK imports**: The types may need to be imported differently in v0.39.0. Check `node_modules/@anthropic-ai/sdk` for actual export paths. Common alternatives:
   - `import type { MessageParam } from "@anthropic-ai/sdk/resources/messages"`  (without .js)
   - `import type { Messages } from "@anthropic-ai/sdk/resources"`
   - Direct: `import Anthropic from "@anthropic-ai/sdk"` then use `Anthropic.Messages.MessageParam` etc.

2. **stdin conflict fix**: In `confirmTransaction`, consider accepting a `readline.Interface` parameter or using a shared readline instance. Alternatively, pause the main readline before calling confirm and resume after.

3. **The `swap_tokens` tool requires `pool_address`**: The system prompt should instruct the AI to inform users that pool addresses are required for swaps if they aren't known. In a future version, pool discovery could be added.

4. **Build script**: `npm run build` runs `tsc`. The `dist/` directory already has a previous build. A clean build can be verified with `rm -rf dist && npm run build`.