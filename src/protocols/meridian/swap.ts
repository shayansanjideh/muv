import {
  AccountAddress,
  type InputGenerateTransactionPayloadData,
} from "@aptos-labs/ts-sdk";
import { type TokenInfo, parseTokenAmount } from "../../data/tokens.js";

// Meridian contract addresses
const MERIDIAN_AMM =
  "0xfbdb3da73efcfa742d542f152d65fc6da7b55dee864cd66475213e4be18c9d54";
const MERIDIAN_CLAMM =
  "0x88def51006db6ae8f90051a1531d1b43877eeb233f4c0d99dcb24f49cd27ad5b";

// AMM pool types determine which swap function to call
export type AmmPoolType = "stable" | "weighted" | "metastable";

export interface SwapParams {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  amount: string;
  slippageBps?: number; // basis points, default 50 (0.5%)
  expectedOutput?: string; // expected output amount (in toToken units) for slippage calc
  useCLAMM?: boolean;
  ammPoolType?: AmmPoolType; // required for AMM swaps; defaults to "weighted"
}

function calculateMinOutput(expectedOutput: bigint, slippageBps: number): bigint {
  return (expectedOutput * BigInt(10000 - slippageBps)) / 10000n;
}

export function buildAmmSwapPayload(params: SwapParams): InputGenerateTransactionPayloadData {
  const rawAmount = parseTokenAmount(params.amount, params.fromToken.decimals);
  const slippageBps = params.slippageBps ?? 50;
  const poolType = params.ammPoolType ?? "weighted";

  // AMM has pool-type-specific swap functions — no generic router exists
  const swapFnName = `swap_exact_in_${poolType}`;

  // Compute minOutput from expectedOutput if provided, otherwise use 1n (no slippage protection)
  let minOutput = 1n;
  if (params.expectedOutput) {
    const expectedRaw = parseTokenAmount(params.expectedOutput, params.toToken.decimals);
    minOutput = calculateMinOutput(expectedRaw, slippageBps);
  }

  return {
    function: `${MERIDIAN_AMM}::pool::${swapFnName}`,
    typeArguments: [],
    functionArguments: [
      AccountAddress.fromString(params.fromToken.faAddress),
      AccountAddress.fromString(params.toToken.faAddress),
      rawAmount,
      minOutput,
    ],
  };
}

export function buildClammSwapPayload(params: SwapParams): InputGenerateTransactionPayloadData {
  const rawAmount = parseTokenAmount(params.amount, params.fromToken.decimals);
  const slippageBps = params.slippageBps ?? 50;

  let minOutput = 1n;
  if (params.expectedOutput) {
    const expectedRaw = parseTokenAmount(params.expectedOutput, params.toToken.decimals);
    minOutput = calculateMinOutput(expectedRaw, slippageBps);
  }

  return {
    function: `${MERIDIAN_CLAMM}::scripts::swap`,
    typeArguments: [],
    functionArguments: [
      AccountAddress.fromString(params.fromToken.faAddress),
      AccountAddress.fromString(params.toToken.faAddress),
      rawAmount,
      minOutput,
    ],
  };
}

export function buildSwapPayload(params: SwapParams): InputGenerateTransactionPayloadData {
  if (params.useCLAMM) {
    return buildClammSwapPayload(params);
  }
  return buildAmmSwapPayload(params);
}
