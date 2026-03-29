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

export interface SwapParams {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  amount: string;
  slippageBps?: number; // basis points, default 50 (0.5%)
  useCLAMM?: boolean;
}

export function buildAmmSwapPayload(params: SwapParams): InputGenerateTransactionPayloadData {
  const rawAmount = parseTokenAmount(params.amount, params.fromToken.decimals);
  const slippage = params.slippageBps ?? 50;
  // Min output = 0 for now; in production, fetch quote first
  const minOutput = 0n;

  return {
    function: `${MERIDIAN_AMM}::router::swap_exact_input`,
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
  const minOutput = 0n;

  return {
    function: `${MERIDIAN_CLAMM}::router::swap_exact_input`,
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
