import { AccountAddress } from "@aptos-labs/ts-sdk";
import { aptosClient } from "./client.js";
import { TOKEN_REGISTRY, formatTokenAmount, type TokenInfo } from "../data/tokens.js";

export interface TokenBalance {
  token: TokenInfo;
  rawAmount: bigint;
  formatted: string;
}

export function normalizeAddress(addr: string): string {
  const hex = addr.startsWith("0x") ? addr.slice(2) : addr;
  return "0x" + hex.padStart(64, "0");
}

export async function getBalance(
  address: AccountAddress,
  tokenAddress: string
): Promise<bigint> {
  const [rawAmount] = await aptosClient.viewJson<[string]>({
    payload: {
      function: "0x1::primary_fungible_store::balance",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [address.toString(), tokenAddress],
    },
  });
  return BigInt(rawAmount);
}

export async function getAllBalances(
  address: AccountAddress
): Promise<TokenBalance[]> {
  try {
    const balances = await aptosClient.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: address.toString() },
          amount: { _gt: 0 },
        },
      },
    });

    const results: TokenBalance[] = [];
    for (const bal of balances) {
      const token = TOKEN_REGISTRY.find(
        (t) => normalizeAddress(t.faAddress) === normalizeAddress(bal.asset_type ?? "")
      );
      if (token) {
        const rawAmount = BigInt(bal.amount);
        results.push({
          token,
          rawAmount,
          formatted: formatTokenAmount(rawAmount, token.decimals),
        });
      }
    }
    return results;
  } catch (error) {
    throw new Error(`Failed to fetch balances: ${error}`);
  }
}
