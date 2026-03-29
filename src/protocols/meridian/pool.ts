import { AccountAddress } from "@aptos-labs/ts-sdk";
import { aptosClient } from "../../chain/client.js";

const MERIDIAN_AMM =
  "0xfbdb3da73efcfa742d542f152d65fc6da7b55dee864cd66475213e4be18c9d54";

export interface PoolInfo {
  tokenA: string;
  tokenB: string;
  reserveA: string;
  reserveB: string;
}

export async function getPoolInfo(
  tokenAAddress: string,
  tokenBAddress: string
): Promise<PoolInfo | null> {
  try {
    const resources = await aptosClient.getAccountResources({
      accountAddress: AccountAddress.fromString(MERIDIAN_AMM),
    });

    // Look for the pool resource matching these tokens
    for (const resource of resources) {
      if (resource.type.includes("pool::LiquidityPool") || resource.type.includes("pool::Pool")) {
        const data = resource.data as Record<string, unknown>;
        return {
          tokenA: tokenAAddress,
          tokenB: tokenBAddress,
          reserveA: String(data.reserve_a ?? "0"),
          reserveB: String(data.reserve_b ?? "0"),
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function getUserPositions(
  userAddress: string
): Promise<Array<{ pool: string; liquidity: string }>> {
  try {
    const resources = await aptosClient.getAccountResources({
      accountAddress: AccountAddress.fromString(userAddress),
    });

    const positions: Array<{ pool: string; liquidity: string }> = [];
    for (const resource of resources) {
      if (resource.type.includes("pool::LiquidityPosition") || resource.type.includes("pool::LP")) {
        const data = resource.data as Record<string, unknown>;
        positions.push({
          pool: resource.type,
          liquidity: String(data.liquidity ?? data.amount ?? "0"),
        });
      }
    }
    return positions;
  } catch {
    return [];
  }
}
