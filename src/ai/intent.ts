import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ContentBlockParam,
  ToolUseBlock,
  TextBlock,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import type OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { getAnthropicClient } from "./client.js";
import { getOpenAIClient } from "./client.js";
import { getSystemPrompt } from "./prompts.js";
import type { Personality, Provider } from "../config.js";
import { getAccount } from "../wallet.js";
import { findToken, TOKEN_REGISTRY, formatTokenAmount } from "../data/tokens.js";
import { getBalance, getAllBalances } from "../chain/balance.js";
import { buildTransferPayload } from "../chain/transfer.js";
import { buildSwapPayload, type SwapParams, type AmmPoolType } from "../protocols/meridian/swap.js";
import { getUserPositions } from "../protocols/meridian/pool.js";
import { getUserFarmingPositions } from "../protocols/meridian/farming.js";
import { buildAndSubmitTransaction } from "../chain/transactions.js";
import { displayPreview, displayResult, displayError } from "../ui/display.js";
import { confirmTransaction } from "../ui/confirm.js";
import { AccountAddress } from "@aptos-labs/ts-sdk";

// ---------- Shared tool definitions (neutral format) ----------

interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

const TOOL_DEFS: ToolDef[] = [
  {
    name: "get_balance",
    description: "Get the balance of a specific token for the user's wallet.",
    parameters: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token symbol (e.g., MOVE, USDC.e, WETH.e)" },
      },
      required: ["token"],
    },
  },
  {
    name: "get_all_balances",
    description: "Get all non-zero token balances for the user's wallet.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "transfer_token",
    description: "Transfer tokens to another address. ALWAYS preview first, then ask user to confirm.",
    parameters: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token symbol to send" },
        amount: { type: "string", description: "Amount to send" },
        recipient: { type: "string", description: "Recipient wallet address (0x...)" },
      },
      required: ["token", "amount", "recipient"],
    },
  },
  {
    name: "swap_tokens",
    description: "Swap tokens on Meridian DEX. ALWAYS preview first, then ask user to confirm.",
    parameters: {
      type: "object",
      properties: {
        token_in: { type: "string", description: "Token to sell" },
        token_out: { type: "string", description: "Token to buy" },
        amount_in: { type: "string", description: "Amount of token_in to sell" },
        pool_address: { type: "string", description: "On-chain pool object address (0x...)" },
        use_clamm: { type: "boolean", description: "Whether to use CLAMM instead of AMM (default: false)" },
        slippage_bps: { type: "number", description: "Slippage tolerance in basis points (default: 50 = 0.5%)" },
        amm_pool_type: { type: "string", enum: ["stable", "weighted", "metastable"], description: "AMM pool type (default: weighted)" },
        expected_output: { type: "string", description: "Expected output amount for slippage calculation" },
      },
      required: ["token_in", "token_out", "amount_in", "pool_address"],
    },
  },
  {
    name: "get_positions",
    description: "Get the user's LP (liquidity provider) positions on Meridian.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_farming_positions",
    description: "Get the user's farming/staking positions on Meridian.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "list_supported_tokens",
    description: "List all tokens supported by muv.",
    parameters: { type: "object", properties: {} },
  },
];

function toAnthropicTools(): Anthropic.Tool[] {
  return TOOL_DEFS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as Anthropic.Tool["input_schema"],
  }));
}

function toOpenAITools(): ChatCompletionTool[] {
  return TOOL_DEFS.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

// ---------- Shared tool handler ----------

async function handleToolCall(
  name: string,
  input: Record<string, unknown>,
  walletAddress: string
): Promise<string> {
  try {
    switch (name) {
      case "get_balance": {
        const token = findToken(input.token as string);
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
        return JSON.stringify(balances.map((b) => ({ token: b.token.symbol, balance: b.formatted })));
      }

      case "transfer_token": {
        const token = findToken(input.token as string);
        if (!token) return JSON.stringify({ error: `Unknown token: ${input.token}` });

        displayPreview("Transfer", { token: token.symbol, amount: input.amount, recipient: input.recipient });
        const confirmed = await confirmTransaction();
        if (!confirmed) {
          return JSON.stringify({ status: "cancelled", message: "User cancelled the transfer." });
        }

        const account = getAccount();
        const payload = buildTransferPayload(token, input.recipient as string, input.amount as string);
        const result = await buildAndSubmitTransaction(account, payload);
        displayResult("Transfer", result.hash);
        return JSON.stringify({ status: "success", txHash: result.hash, message: `Transferred ${input.amount} ${token.symbol} to ${input.recipient}` });
      }

      case "swap_tokens": {
        const tokenIn = findToken(input.token_in as string);
        const tokenOut = findToken(input.token_out as string);
        if (!tokenIn) return JSON.stringify({ error: `Unknown token: ${input.token_in}` });
        if (!tokenOut) return JSON.stringify({ error: `Unknown token: ${input.token_out}` });

        const params: SwapParams = {
          fromToken: tokenIn,
          toToken: tokenOut,
          amount: input.amount_in as string,
          poolAddress: input.pool_address as string,
          useCLAMM: (input.use_clamm as boolean) ?? false,
          slippageBps: (input.slippage_bps as number) ?? 50,
          ammPoolType: (input.amm_pool_type as AmmPoolType) ?? "weighted",
          expectedOutput: input.expected_output as string | undefined,
        };

        displayPreview("Swap", {
          from: `${input.amount_in} ${tokenIn.symbol}`,
          to: tokenOut.symbol,
          pool: input.pool_address,
          mode: params.useCLAMM ? "CLAMM" : "AMM",
          slippage: `${(params.slippageBps ?? 50) / 100}%`,
        });

        const confirmed = await confirmTransaction();
        if (!confirmed) {
          return JSON.stringify({ status: "cancelled", message: "User cancelled the swap." });
        }

        const account = getAccount();
        const payload = buildSwapPayload(params);
        const result = await buildAndSubmitTransaction(account, payload);
        displayResult("Swap", result.hash);
        return JSON.stringify({ status: "success", txHash: result.hash, message: `Swapped ${input.amount_in} ${tokenIn.symbol} for ${tokenOut.symbol}` });
      }

      case "get_positions": {
        const positions = await getUserPositions(walletAddress);
        if (positions.length === 0) return JSON.stringify({ message: "No LP positions found on Meridian." });
        return JSON.stringify(positions);
      }

      case "get_farming_positions": {
        const positions = await getUserFarmingPositions(walletAddress);
        if (positions.length === 0) return JSON.stringify({ message: "No farming positions found on Meridian." });
        return JSON.stringify(positions);
      }

      case "list_supported_tokens": {
        return JSON.stringify(TOKEN_REGISTRY.map((t) => ({ symbol: t.symbol, name: t.name, decimals: t.decimals })));
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    displayError(msg);
    return JSON.stringify({ error: msg });
  }
}

// ---------- Session interface ----------

export interface ConversationSession {
  processInput(userInput: string): Promise<string>;
}

export function createSession(
  provider: Provider,
  personality: Personality,
  walletAddress: string,
  apiKey: string
): ConversationSession {
  if (provider === "openai") {
    return new OpenAISession(personality, walletAddress, apiKey);
  }
  return new AnthropicSession(personality, walletAddress, apiKey);
}

// ---------- Anthropic session ----------

class AnthropicSession implements ConversationSession {
  private messages: MessageParam[] = [];
  private systemPrompt: string;
  private walletAddr: string;
  private apiKey: string;

  constructor(personality: Personality, walletAddress: string, apiKey: string) {
    this.systemPrompt = getSystemPrompt(personality, walletAddress);
    this.walletAddr = walletAddress;
    this.apiKey = apiKey;
  }

  async processInput(userInput: string): Promise<string> {
    this.messages.push({ role: "user", content: userInput });

    const client = getAnthropicClient(this.apiKey);
    const tools = toAnthropicTools();

    let response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: this.systemPrompt,
      tools,
      messages: this.messages,
    });

    while (response.stop_reason === "tool_use") {
      const assistantContent = response.content;
      this.messages.push({ role: "assistant", content: assistantContent });

      const toolResults: ToolResultBlockParam[] = [];
      for (const block of assistantContent) {
        if (block.type === "tool_use") {
          const result = await handleToolCall(
            block.name,
            block.input as Record<string, unknown>,
            this.walletAddr
          );
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }

      this.messages.push({ role: "user", content: toolResults as ContentBlockParam[] });

      response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: this.systemPrompt,
        tools,
        messages: this.messages,
      });
    }

    const textBlocks = response.content.filter((b): b is TextBlock => b.type === "text");
    const finalText = textBlocks.map((b) => b.text).join("\n");
    this.messages.push({ role: "assistant", content: response.content });
    return finalText;
  }

}

// ---------- OpenAI session ----------

class OpenAISession implements ConversationSession {
  private messages: ChatCompletionMessageParam[] = [];
  private walletAddress: string;
  private apiKey: string;

  constructor(personality: Personality, walletAddress: string, apiKey: string) {
    this.walletAddress = walletAddress;
    this.apiKey = apiKey;
    this.messages.push({
      role: "system",
      content: getSystemPrompt(personality, walletAddress),
    });
  }

  async processInput(userInput: string): Promise<string> {
    this.messages.push({ role: "user", content: userInput });

    const client = getOpenAIClient(this.apiKey);
    const tools = toOpenAITools();

    let response = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      tools,
      messages: this.messages,
    });

    let choice = response.choices[0];

    while (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      this.messages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.type !== "function") continue;
        const fn = toolCall.function;
        const args = JSON.parse(fn.arguments);
        const result = await handleToolCall(fn.name, args, this.walletAddress);
        this.messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      response = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        tools,
        messages: this.messages,
      });
      choice = response.choices[0];
    }

    const finalText = choice.message.content ?? "";
    this.messages.push(choice.message);
    return finalText;
  }
}
