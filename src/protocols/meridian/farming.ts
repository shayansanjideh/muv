import {
  AccountAddress,
  type InputGenerateTransactionPayloadData,
} from "@aptos-labs/ts-sdk";
import { aptosClient } from "../../chain/client.js";

const MERIDIAN_FARMING =
  "0xf1fc2bc72b9eeaa3cc80239d5c00e49ebab0b2c8a5b55227ce47644b3275ff96";

export interface FarmingPosition {
  pool: string;
  stakedAmount: string;
  pendingRewards: string;
}

export async function getUserFarmingPositions(
  userAddress: string
): Promise<FarmingPosition[]> {
  try {
    const resources = await aptosClient.getAccountResources({
      accountAddress: AccountAddress.fromString(userAddress),
    });

    const positions: FarmingPosition[] = [];
    for (const resource of resources) {
      if (resource.type.includes("farming::StakePosition") || resource.type.includes("farming::Farm") || resource.type.includes("farming::UserInfo")) {
        const data = resource.data as Record<string, unknown>;
        positions.push({
          pool: resource.type,
          stakedAmount: String(data.amount ?? data.staked ?? "0"),
          pendingRewards: String(data.pending_rewards ?? data.rewards ?? "0"),
        });
      }
    }
    return positions;
  } catch {
    return [];
  }
}

export function buildStakePayload(
  poolId: number,
  amount: bigint
): InputGenerateTransactionPayloadData {
  // scripts::stake(&signer, u64, u64) = (signer, pool_id, amount)
  return {
    function: `${MERIDIAN_FARMING}::scripts::stake`,
    typeArguments: [],
    functionArguments: [
      poolId,
      amount,
    ],
  };
}

export function buildUnstakePayload(
  poolId: number,
  amount: bigint
): InputGenerateTransactionPayloadData {
  // scripts::unstake(&signer, u64, u64) = (signer, pool_id, amount)
  return {
    function: `${MERIDIAN_FARMING}::scripts::unstake`,
    typeArguments: [],
    functionArguments: [
      poolId,
      amount,
    ],
  };
}

export function buildClaimRewardsPayload(
  poolId: number
): InputGenerateTransactionPayloadData {
  // scripts::claim(&signer, u64) = (signer, pool_id)
  return {
    function: `${MERIDIAN_FARMING}::scripts::claim`,
    typeArguments: [],
    functionArguments: [
      poolId,
    ],
  };
}
