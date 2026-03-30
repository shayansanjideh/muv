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

// Map legacy coin types to FA addresses
const LEGACY_COIN_MAP: Record<string, string> = {
  "0x1::aptos_coin::AptosCoin": "0x000000000000000000000000000000000000000000000000000000000000000a",
};

function matchToken(assetType: string): TokenInfo | undefined {
  // Try legacy coin type mapping first
  const mappedAddress = LEGACY_COIN_MAP[assetType];
  if (mappedAddress) {
    return TOKEN_REGISTRY.find(
      (t) => normalizeAddress(t.faAddress) === normalizeAddress(mappedAddress)
    );
  }

  // Try direct FA address match
  return TOKEN_REGISTRY.find(
    (t) => normalizeAddress(t.faAddress) === normalizeAddress(assetType)
  );
}

export async function getBalance(
  address: AccountAddress,
  tokenAddress: string
): Promise<bigint> {
  // Try FA balance first
  try {
    const [rawAmount] = await aptosClient.viewJson<[string]>({
      payload: {
        function: "0x1::primary_fungible_store::balance",
        typeArguments: ["0x1::fungible_asset::Metadata"],
        functionArguments: [address.toString(), tokenAddress],
      },
    });
    const amount = BigInt(rawAmount);
    if (amount > 0n) return amount;
  } catch {
    // FA store might not exist, fall through to legacy check
  }

  // Fall back to legacy CoinStore for MOVE
  if (normalizeAddress(tokenAddress) === normalizeAddress("0xa")) {
    try {
      const amount = await aptosClient.getAccountAPTAmount({ accountAddress: address });
      return BigInt(amount);
    } catch {
      return 0n;
    }
  }

  return 0n;
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
      const token = matchToken(bal.asset_type ?? "");
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
