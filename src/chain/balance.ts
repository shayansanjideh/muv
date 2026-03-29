import { AccountAddress } from "@aptos-labs/ts-sdk";
import { aptosClient } from "./client.js";
import { TOKEN_REGISTRY, formatTokenAmount, type TokenInfo } from "../data/tokens.js";

export interface TokenBalance {
  token: TokenInfo;
  rawAmount: bigint;
  formatted: string;
}

export async function getBalance(
  address: AccountAddress,
  tokenAddress: string
): Promise<bigint> {
  try {
    const balances = await aptosClient.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: address.toString() },
          asset_type: { _eq: tokenAddress },
        },
      },
    });

    if (balances.length > 0) {
      return BigInt(balances[0].amount);
    }
    return 0n;
  } catch {
    return 0n;
  }
}

export async function getAllBalances(
  address: AccountAddress
): Promise<TokenBalance[]> {
  try {
    const balances = await aptosClient.getCurrentFungibleAssetBalances({
      options: {
        where: {
          owner_address: { _eq: address.toString() },
          amount: { _gt: "0" },
        },
      },
    });

    const results: TokenBalance[] = [];
    for (const bal of balances) {
      const token = TOKEN_REGISTRY.find(
        (t) => t.faAddress.toLowerCase() === bal.asset_type?.toLowerCase()
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
