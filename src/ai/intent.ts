import type Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, Tool, ContentBlock, ToolUseBlock, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages.js";
import { getAIClient } from "./client.js";
import { getSystemPrompt } from "./prompts.js";
import { findToken, formatTokenAmount, TOKEN_REGISTRY } from "../data/tokens.js";
import { getAllBalances, getBalance } from "../chain/balance.js";
import { buildTransferPayload } from "../chain/transfer.js";
import { buildSwapPayload, type SwapParams } from "../protocols/meridian/swap.js";
import { getUserPositions } from "../protocols/meridian/pool.js";
import { getUserFarmingPositions } from "../protocols/meridian/farming.js";
import { buildAndSubmitTransaction, simulateTransaction } from "../chain/transactions.js";
import { displayBalances, displayTransactionPreview, displaySuccess, displayError } from "../ui/display.js";
import { confirmTransaction } from "../ui/confirm.js";
import { getAccount, getAddress } from "../wallet.js";
import { AccountAddress } from "@aptos-labs/ts-sdk";

const tools: Tool[] = [
  {
    name: "get_balances",
    description:
      "Get all token balances for the user's wallet. Use this when the user asks about their balance, holdings, or portfolio.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_token_balance",
    description:
      "Get the balance of a specific token for the user's wallet.",
    input_schema: {
      type: "object" as const,
      properties: {
        token_symbol: {
          type: "string",
          description: "The token symbol (e.g., MOVE, USDC.e, WETH.e)",
        },
      },
      required: ["token_symbol"],
    },
  },
  {
    name: "swap_tokens",
    description:
      "Swap one token for another on Meridian DEX. Use this when the user wants to swap, exchange, or trade tokens.",
    input_schema: {
      type: "object" as const,
      properties: {
        from_token: {
          type: "string",
          description: "Symbol of the token to swap from",
        },
        to_token: {
          type: "string",
          description: "Symbol of the token to swap to",
        },
        amount: {
          type: "string",
          description: "Amount of the from_token to swap",
        },
        use_clamm: {
          type: "boolean",
          description: "Whether to use CLAMM instead of AMM (default: false)",
        },
        slippage_bps: {
          type: "number",
          description: "Slippage tolerance in basis points (default: 50 = 0.5%)",
        },
      },
      required: ["from_token", "to_token", "amount"],
    },
  },
  {
    name: "transfer_tokens",
    description:
      "Transfer tokens to another address. Use this when the user wants to send tokens to someone.",
    input_schema: {
      type: "object" as const,
      properties: {
        token_symbol: {
          type: "string",
          description: "Symbol of the token to transfer",
        },
        recipient: {
          type: "string",
          description: "Recipient wallet address (0x...)",
        },
        amount: {
          type: "string",
          description: "Amount to transfer",
        },
      },
      required: ["token_symbol", "recipient", "amount"],
    },
  },
  {
    name: "get_positions",
    description:
      "Get the user's Meridian DEX liquidity and farming positions.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

async function handleToolCall(
  toolName: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    switch (toolName) {
      case "get_balances": {
        const address = getAddress();
        const balances = await getAllBalances(address);
        return displayBalances(balances);
      }

      case "get_token_balance": {
        const symbol = input.token_symbol as string;
        const token = findToken(symbol);
        if (!token) return displayError(`Unknown token: ${symbol}`);
        const address = getAddress();
        const balance = await getBalance(address, token.faAddress);
        const formatted = formatTokenAmount(balance, token.decimals);
        return `${token.symbol}: ${formatted}`;
      }

      case "swap_tokens": {
        const fromToken = findToken(input.from_token as string);
        const toToken = findToken(input.to_token as string);
        if (!fromToken) return displayError(`Unknown token: ${input.from_token}`);
        if (!toToken) return displayError(`Unknown token: ${input.to_token}`);

        const params: SwapParams = {
          fromToken,
          toToken,
          amount: input.amount as string,
          useCLAMM: (input.use_clamm as boolean) ?? false,
          slippageBps: (input.slippage_bps as number) ?? 50,
        };

        const payload = buildSwapPayload(params);
        const account = getAccount();
        const sim = await simulateTransaction(account, payload);

        const preview = displayTransactionPreview({
          action: "Swap",
          details: {
            From: `${input.amount} ${fromToken.symbol}`,
            To: toToken.symbol,
            DEX: params.useCLAMM ? "Meridian CLAMM" : "Meridian AMM",
            Slippage: `${(params.slippageBps ?? 50) / 100}%`,
          },
          gasEstimate: sim.gasEstimate,
        });

        const confirmed = await confirmTransaction(preview);
        if (!confirmed) return "Transaction cancelled.";

        const result = await buildAndSubmitTransaction(account, payload);
        return displaySuccess(result.hash);
      }

      case "transfer_tokens": {
        const token = findToken(input.token_symbol as string);
        if (!token) return displayError(`Unknown token: ${input.token_symbol}`);

        const payload = buildTransferPayload(
          token,
          input.recipient as string,
          input.amount as string
        );
        const account = getAccount();
        const sim = await simulateTransaction(account, payload);

        const preview = displayTransactionPreview({
          action: "Transfer",
          details: {
            Token: token.symbol,
            Amount: input.amount as string,
            To: input.recipient as string,
          },
          gasEstimate: sim.gasEstimate,
        });

        const confirmed = await confirmTransaction(preview);
        if (!confirmed) return "Transaction cancelled.";

        const result = await buildAndSubmitTransaction(account, payload);
        return displaySuccess(result.hash);
      }

      case "get_positions": {
        const address = getAddress();
        const [lpPositions, farmPositions] = await Promise.all([
          getUserPositions(address.toString()),
          getUserFarmingPositions(address.toString()),
        ]);

        const lines: string[] = [];
        if (lpPositions.length === 0 && farmPositions.length === 0) {
          return "No Meridian positions found.";
        }

        if (lpPositions.length > 0) {
          lines.push("LP Positions:");
          for (const pos of lpPositions) {
            lines.push(`  ${pos.pool}: ${pos.liquidity}`);
          }
        }

        if (farmPositions.length > 0) {
          lines.push("Farming Positions:");
          for (const pos of farmPositions) {
            lines.push(`  ${pos.pool}: staked ${pos.stakedAmount}, rewards ${pos.pendingRewards}`);
          }
        }

        return lines.join("\n");
      }

      default:
        return displayError(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    return displayError(`${error}`);
  }
}

export class ConversationManager {
  private messages: MessageParam[] = [];
  private systemPrompt: string;

  constructor(personality: "terse" | "friendly", walletAddress: string) {
    this.systemPrompt = getSystemPrompt(personality, walletAddress);
  }

  async processInput(userInput: string): Promise<string> {
    this.messages.push({ role: "user", content: userInput });

    const client = getAIClient();
    let response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: this.systemPrompt,
      tools,
      messages: this.messages,
    });

    // Handle tool use loop
    while (response.stop_reason === "tool_use") {
      const assistantContent = response.content;
      this.messages.push({ role: "assistant", content: assistantContent });

      const toolResults: ToolResultBlockParam[] = [];
      for (const block of assistantContent) {
        if (block.type === "tool_use") {
          const result = await handleToolCall(
            block.name,
            block.input as Record<string, unknown>
          );
          console.log(result);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      this.messages.push({ role: "user", content: toolResults });

      response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: this.systemPrompt,
        tools,
        messages: this.messages,
      });
    }

    // Extract text response
    const textBlocks = response.content.filter(
      (block): block is Extract<ContentBlock, { type: "text" }> =>
        block.type === "text"
    );
    const reply = textBlocks.map((b) => b.text).join("\n");

    this.messages.push({ role: "assistant", content: response.content });

    return reply;
  }
}
