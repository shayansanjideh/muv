import {
  AccountAddress,
  type InputGenerateTransactionPayloadData,
} from "@aptos-labs/ts-sdk";
import { type TokenInfo, parseTokenAmount } from "../data/tokens.js";

const MOVE_FA_ADDRESS =
  "0x000000000000000000000000000000000000000000000000000000000000000a";

export function buildTransferPayload(
  token: TokenInfo,
  recipientAddress: string,
  amount: string
): InputGenerateTransactionPayloadData {
  const rawAmount = parseTokenAmount(amount, token.decimals);

  if (token.faAddress === MOVE_FA_ADDRESS) {
    return {
      function: "0x1::aptos_account::transfer",
      functionArguments: [
        AccountAddress.fromString(recipientAddress),
        rawAmount,
      ],
    };
  }

  // Fungible asset transfer
  return {
    function: "0x1::primary_fungible_store::transfer",
    typeArguments: ["0x1::fungible_asset::Metadata"],
    functionArguments: [
      AccountAddress.fromString(token.faAddress),
      AccountAddress.fromString(recipientAddress),
      rawAmount,
    ],
  };
}
