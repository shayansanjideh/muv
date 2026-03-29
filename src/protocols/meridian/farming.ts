import {
  AccountAddress,
  type InputGenerateTransactionPayloadData,
} from "@aptos-labs/ts-sdk";
import { aptosClient } from "../../chain/client.js";

const MERIDIAN_FARMING =
  "0xf1fc2bc72b9eeaa3cc80239d5c00e49ebab0b2c8a5b55227ce47644b3275ff96";
const MERIDIAN_CLAMM_FARMING =
  "0x4c5da52eaa510af14e93e7b16dddf3c5d6a9b3f847d18dc8e7499fc71a5a0a24";

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
      if (resource.type.includes("StakePosition") || resource.type.includes("Farm")) {
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
  lpTokenAddress: string,
  amount: bigint,
  useClamm: boolean = false
): InputGenerateTransactionPayloadData {
  const contract = useClamm ? MERIDIAN_CLAMM_FARMING : MERIDIAN_FARMING;
  return {
    function: `${contract}::farming::stake`,
    typeArguments: [],
    functionArguments: [
      AccountAddress.fromString(lpTokenAddress),
      amount,
    ],
  };
}

export function buildUnstakePayload(
  lpTokenAddress: string,
  amount: bigint,
  useClamm: boolean = false
): InputGenerateTransactionPayloadData {
  const contract = useClamm ? MERIDIAN_CLAMM_FARMING : MERIDIAN_FARMING;
  return {
    function: `${contract}::farming::unstake`,
    typeArguments: [],
    functionArguments: [
      AccountAddress.fromString(lpTokenAddress),
      amount,
    ],
  };
}

export function buildClaimRewardsPayload(
  lpTokenAddress: string,
  useClamm: boolean = false
): InputGenerateTransactionPayloadData {
  const contract = useClamm ? MERIDIAN_CLAMM_FARMING : MERIDIAN_FARMING;
  return {
    function: `${contract}::farming::claim_rewards`,
    typeArguments: [],
    functionArguments: [
      AccountAddress.fromString(lpTokenAddress),
    ],
  };
}
