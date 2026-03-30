import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { findToken, formatTokenAmount } from "./data/tokens.js";
import { getAllBalances, getBalance } from "./chain/balance.js";
import { buildTransferPayload } from "./chain/transfer.js";
import { buildSwapPayload, type SwapParams } from "./protocols/meridian/swap.js";
import { getUserPositions } from "./protocols/meridian/pool.js";
import { getUserFarmingPositions } from "./protocols/meridian/farming.js";
import { buildAndSubmitTransaction } from "./chain/transactions.js";
import { accountFromPrivateKey, loadWallet } from "./wallet.js";

function getPrivateKey(): string {
  if (process.env.MUV_PRIVATE_KEY) return process.env.MUV_PRIVATE_KEY;
  const wallet = loadWallet();
  if (wallet?.privateKey) return wallet.privateKey;
  throw new Error("No wallet configured. Run `muv` to set up your wallet first.");
}

function getWalletAddress(provided?: string): string {
  if (provided) return provided;
  const wallet = loadWallet();
  if (wallet?.address) return wallet.address;
  throw new Error("No wallet configured. Run `muv` to set up your wallet first.");
}

function jsonResponse(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

function errorResponse(message: string) {
  return jsonResponse({ error: true, message });
}

export async function startServer(): Promise<void> {
  const server = new McpServer({ name: "muv", version: "0.1.0" });

  // Tool: get_wallet_info
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

  // Tool: get_balances
  server.tool(
    "get_balances",
    "Get all token balances for the user's wallet on the Movement blockchain. Wallet address is auto-detected from config.",
    { wallet_address: z.string().optional().describe("Wallet address (0x...). Omit to use the configured wallet.") },
    async ({ wallet_address }) => {
      try {
        const address = AccountAddress.fromString(getWalletAddress(wallet_address));
        const balances = await getAllBalances(address);
        return jsonResponse({
          balances: balances.map((b) => ({
            symbol: b.token.symbol,
            name: b.token.name,
            balance: b.formatted,
            faAddress: b.token.faAddress,
          })),
        });
      } catch (error) {
        return errorResponse(String(error));
      }
    }
  );

  // Tool: get_token_balance
  server.tool(
    "get_token_balance",
    "Get the balance of a specific token for the user's wallet. Wallet address is auto-detected from config.",
    {
      wallet_address: z.string().optional().describe("Wallet address (0x...). Omit to use the configured wallet."),
      token_symbol: z.string().describe("The token symbol (e.g., MOVE, USDC.e, WETH.e)"),
    },
    async ({ wallet_address, token_symbol }) => {
      try {
        const token = findToken(token_symbol);
        if (!token) return errorResponse(`Unknown token: ${token_symbol}`);
        const address = AccountAddress.fromString(getWalletAddress(wallet_address));
        const balance = await getBalance(address, token.faAddress);
        const formatted = formatTokenAmount(balance, token.decimals);
        return jsonResponse({
          symbol: token.symbol,
          name: token.name,
          balance: formatted,
          faAddress: token.faAddress,
        });
      } catch (error) {
        return errorResponse(String(error));
      }
    }
  );

  // Tool: swap_tokens
  server.tool(
    "swap_tokens",
    "Swap one token for another on Meridian DEX on the Movement blockchain.",
    {
      from_token: z.string().describe("Symbol of the token to swap from"),
      to_token: z.string().describe("Symbol of the token to swap to"),
      amount: z.string().describe("Amount of the from_token to swap"),
      pool_address: z.string().describe("On-chain pool object address (0x...)"),
      use_clamm: z.boolean().optional().describe("Whether to use CLAMM instead of AMM (default: false)"),
      slippage_bps: z.number().optional().describe("Slippage tolerance in basis points (default: 50 = 0.5%)"),
      amm_pool_type: z.enum(["stable", "weighted", "metastable"]).optional().describe("AMM pool type (default: weighted)"),
      expected_output: z.string().optional().describe("Expected output amount for slippage calculation"),
      zero_for_one: z.boolean().optional().describe("CLAMM swap direction flag. true = token0->token1, false = token1->token0"),
    },
    async ({ from_token, to_token, amount, pool_address, use_clamm, slippage_bps, amm_pool_type, expected_output, zero_for_one }) => {
      try {
        const fromToken = findToken(from_token);
        const toToken = findToken(to_token);
        if (!fromToken) return errorResponse(`Unknown token: ${from_token}`);
        if (!toToken) return errorResponse(`Unknown token: ${to_token}`);

        const params: SwapParams = {
          fromToken,
          toToken,
          amount,
          useCLAMM: use_clamm ?? false,
          slippageBps: slippage_bps ?? 50,
          ammPoolType: amm_pool_type ?? "weighted",
          expectedOutput: expected_output,
          poolAddress: pool_address,
          zeroForOne: zero_for_one,
        };

        const payload = buildSwapPayload(params);
        const account = accountFromPrivateKey(getPrivateKey());
        const result = await buildAndSubmitTransaction(account, payload);

        return jsonResponse({
          success: true,
          tx_hash: result.hash,
          details: {
            from: `${amount} ${fromToken.symbol}`,
            to: toToken.symbol,
            dex: params.useCLAMM ? "Meridian CLAMM" : "Meridian AMM",
            slippage: `${(params.slippageBps ?? 50) / 100}%`,
          },
        });
      } catch (error) {
        return errorResponse(String(error));
      }
    }
  );

  // Tool: transfer_tokens
  server.tool(
    "transfer_tokens",
    "Transfer tokens to another address on the Movement blockchain.",
    {
      token_symbol: z.string().describe("Symbol of the token to transfer"),
      recipient: z.string().describe("Recipient wallet address (0x...)"),
      amount: z.string().describe("Amount to transfer"),
    },
    async ({ token_symbol, recipient, amount }) => {
      try {
        const token = findToken(token_symbol);
        if (!token) return errorResponse(`Unknown token: ${token_symbol}`);

        const payload = buildTransferPayload(token, recipient, amount);
        const account = accountFromPrivateKey(getPrivateKey());
        const result = await buildAndSubmitTransaction(account, payload);

        return jsonResponse({
          success: true,
          tx_hash: result.hash,
          details: {
            token: token.symbol,
            amount,
            recipient,
          },
        });
      } catch (error) {
        return errorResponse(String(error));
      }
    }
  );

  // Tool: get_positions
  server.tool(
    "get_positions",
    "Get Meridian DEX liquidity and farming positions for the user's wallet. Wallet address is auto-detected from config.",
    { wallet_address: z.string().optional().describe("Wallet address (0x...). Omit to use the configured wallet.") },
    async ({ wallet_address }) => {
      try {
        const addr = getWalletAddress(wallet_address);
        const [lpPositions, farmPositions] = await Promise.all([
          getUserPositions(addr),
          getUserFarmingPositions(addr),
        ]);

        return jsonResponse({
          lp_positions: lpPositions,
          farming_positions: farmPositions,
        });
      } catch (error) {
        return errorResponse(String(error));
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
