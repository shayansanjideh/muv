import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ContentBlockParam,
  ToolUseBlock,
  TextBlock,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { getAnthropicClient } from "./client.js";
import { getSystemPrompt } from "./prompts.js";
import type { Personality } from "../config.js";
import { getAccount, getAddress } from "../wallet.js";
import { findToken, TOKEN_REGISTRY, formatTokenAmount, parseTokenAmount } from "../data/tokens.js";
import { getBalance, getAllBalances } from "../chain/balance.js";
import { buildTransferPayload } from "../chain/transfer.js";
import { buildSwapPayload, type SwapParams, type AmmPoolType } from "../protocols/meridian/swap.js";
import { getUserPositions } from "../protocols/meridian/pool.js";
import { getUserFarmingPositions } from "../protocols/meridian/farming.js";
import { buildAndSubmitTransaction, simulateTransaction } from "../chain/transactions.js";
import { displayPreview, displayResult, displayError } from "../ui/display.js";
import { confirmTransaction } from "../ui/confirm.js";
import { AccountAddress } from "@aptos-labs/ts-sdk";

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_balance",
    description:
      "Get the balance of a specific token for the user's wallet.",
    input_schema: {
      type: "object" as const,
      properties: {
        token: {
          type: "string",
          description: "Token symbol (e.g., MOVE, USDC.e, WETH.e)",
        },
      },
      required: ["token"],
    },
  },
  {
    name: "get_all_balances",
    description:
      "Get all non-zero token balances for the user's wallet.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "transfer_token",
    description:
      "Transfer tokens to another address. ALWAYS preview first, then ask user to confirm.",
    input_schema: {
      type: "object" as const,
      properties: {
        token: { type: "string", description: "Token symbol to send" },
        amount: { type: "string", description: "Amount to send" },
        recipient: {
          type: "string",
          description: "Recipient wallet address (0x...)",
        },
      },
      required: ["token", "amount", "recipient"],
    },
  },
  {
    name: "swap_tokens",
    description:
      "Swap tokens on Meridian DEX. ALWAYS preview first, then ask user to confirm.",
    input_schema: {
      type: "object" as const,
      properties: {
        token_in: { type: "string", description: "Token to sell" },
        token_out: { type: "string", description: "Token to buy" },
        amount_in: { type: "string", description: "Amount of token_in to sell" },
        pool_address: { type: "string", description: "On-chain pool object address (0x...)" },
        use_clamm: { type: "boolean", description: "Whether to use CLAMM instead of AMM (default: false)" },
        slippage_bps: { type: "number", description: "Slippage tolerance in basis points (default: 50 = 0.5%)" },
        amm_pool_type: {
          type: "string",
          enum: ["stable", "weighted", "metastable"],
          description: "AMM pool type (default: weighted)",
        },
        expected_output: { type: "string", description: "Expected output amount for slippage calculation" },
      },
      required: ["token_in", "token_out", "amount_in", "pool_address"],
    },
  },
  {
    name: "get_positions",
    description: "Get the user's LP (liquidity provider) positions on Meridian.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_farming_positions",
    description: "Get the user's farming/staking positions on Meridian.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "list_supported_tokens",
    description: "List all tokens supported by muv.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
];

export interface ConversationSession {
  messages: MessageParam[];
  personality: Personality;
  walletAddress: string;
  apiKey: string;
}

export function createSession(
  personality: Personality,
  walletAddress: string,
  apiKey: string
): ConversationSession {
  return {
    messages: [],
    personality,
    walletAddress,
    apiKey,
  };
}

export async function processUserInput(
  session: ConversationSession,
  userInput: string
): Promise<string> {
  session.messages.push({ role: "user", content: userInput });

  const client = getAnthropicClient(session.apiKey);
  const systemPrompt = getSystemPrompt(
    session.personality,
    session.walletAddress
  );

  let response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    tools: TOOLS,
    messages: session.messages,
  });

  // Agentic loop: keep processing tool calls until we get a final text response
  while (response.stop_reason === "tool_use") {
    const assistantContent = response.content;
    session.messages.push({ role: "assistant", content: assistantContent });

    const toolResults: ToolResultBlockParam[] = [];

    for (const block of assistantContent) {
      if (block.type === "tool_use") {
        const result = await handleToolCall(block, session.walletAddress);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    session.messages.push({
      role: "user",
      content: toolResults as ContentBlockParam[],
    });

    response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools: TOOLS,
      messages: session.messages,
    });
  }

  // Extract final text response
  const textBlocks = response.content.filter(
    (b): b is TextBlock => b.type === "text"
  );
  const finalText = textBlocks.map((b) => b.text).join("\n");

  session.messages.push({ role: "assistant", content: response.content });

  return finalText;
}

async function handleToolCall(
  toolCall: ToolUseBlock,
  walletAddress: string
): Promise<string> {
  const input = toolCall.input as Record<string, string>;

  try {
    switch (toolCall.name) {
      case "get_balance": {
        const token = findToken(input.token);
        if (!token) return JSON.stringify({ error: `Unknown token: ${input.token}` });
        const address = AccountAddress.fromString(walletAddress);
        const rawBalance = await getBalance(address, token.faAddress);
        const formatted = formatTokenAmount(rawBalance, token.decimals);
        return JSON.stringify({ token: token.symbol, balance: formatted });
      }

      case "get_all_balances": {
        const address = AccountAddress.fromString(walletAddress);
        const balances = await getAllBalances(address);
        if (balances.length === 0) {
          return JSON.stringify({ message: "No non-zero balances found." });
        }
        return JSON.stringify(
          balances.map((b) => ({
            token: b.token.symbol,
            balance: b.formatted,
          }))
        );
      }

      case "transfer_token": {
        const token = findToken(input.token);
        if (!token) return JSON.stringify({ error: `Unknown token: ${input.token}` });

        const preview = {
          token: token.symbol,
          amount: input.amount,
          recipient: input.recipient,
        };
        displayPreview("Transfer", preview);

        const confirmed = await confirmTransaction();
        if (!confirmed) {
          return JSON.stringify({ status: "cancelled", message: "User cancelled the transfer." });
        }

        const account = getAccount();
        const payload = buildTransferPayload(token, input.recipient, input.amount);
        const result = await buildAndSubmitTransaction(account, payload);
        displayResult("Transfer", result.hash);
        return JSON.stringify({
          status: "success",
          txHash: result.hash,
          message: `Transferred ${input.amount} ${token.symbol} to ${input.recipient}`,
        });
      }

      case "swap_tokens": {
        const tokenIn = findToken(input.token_in);
        const tokenOut = findToken(input.token_out);
        if (!tokenIn) return JSON.stringify({ error: `Unknown token: ${input.token_in}` });
        if (!tokenOut) return JSON.stringify({ error: `Unknown token: ${input.token_out}` });

        const rawInput = toolCall.input as Record<string, unknown>;
        const params: SwapParams = {
          fromToken: tokenIn,
          toToken: tokenOut,
          amount: input.amount_in,
          poolAddress: input.pool_address,
          useCLAMM: (rawInput.use_clamm as boolean) ?? false,
          slippageBps: (rawInput.slippage_bps as number) ?? 50,
          ammPoolType: (rawInput.amm_pool_type as AmmPoolType) ?? "weighted",
          expectedOutput: input.expected_output,
        };

        const preview = {
          from: `${input.amount_in} ${tokenIn.symbol}`,
          to: tokenOut.symbol,
          pool: input.pool_address,
          mode: params.useCLAMM ? "CLAMM" : "AMM",
          slippage: `${(params.slippageBps ?? 50) / 100}%`,
        };
        displayPreview("Swap", preview);

        const confirmed = await confirmTransaction();
        if (!confirmed) {
          return JSON.stringify({ status: "cancelled", message: "User cancelled the swap." });
        }

        const account = getAccount();
        const payload = buildSwapPayload(params);
        const result = await buildAndSubmitTransaction(account, payload);
        displayResult("Swap", result.hash);
        return JSON.stringify({
          status: "success",
          txHash: result.hash,
          message: `Swapped ${input.amount_in} ${tokenIn.symbol} for ${tokenOut.symbol}`,
        });
      }

      case "get_positions": {
        const positions = await getUserPositions(walletAddress);
        if (positions.length === 0) {
          return JSON.stringify({ message: "No LP positions found on Meridian." });
        }
        return JSON.stringify(positions);
      }

      case "get_farming_positions": {
        const positions = await getUserFarmingPositions(walletAddress);
        if (positions.length === 0) {
          return JSON.stringify({ message: "No farming positions found on Meridian." });
        }
        return JSON.stringify(positions);
      }

      case "list_supported_tokens": {
        return JSON.stringify(
          TOKEN_REGISTRY.map((t) => ({
            symbol: t.symbol,
            name: t.name,
            decimals: t.decimals,
          }))
        );
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolCall.name}` });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    displayError(msg);
    return JSON.stringify({ error: msg });
  }
}
