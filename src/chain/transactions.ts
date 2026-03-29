import {
  type Account,
  type InputGenerateTransactionPayloadData,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { aptosClient } from "./client.js";

export async function buildAndSubmitTransaction(
  sender: Account,
  payload: InputGenerateTransactionPayloadData
): Promise<UserTransactionResponse> {
  const transaction = await aptosClient.transaction.build.simple({
    sender: sender.accountAddress,
    data: payload,
  });

  const pendingTx = await aptosClient.transaction.signAndSubmitTransaction({
    signer: sender,
    transaction,
  });

  const result = await aptosClient.transaction.waitForTransaction({
    transactionHash: pendingTx.hash,
  });

  return result as UserTransactionResponse;
}

export async function simulateTransaction(
  sender: Account,
  payload: InputGenerateTransactionPayloadData
): Promise<{ gasEstimate: string; success: boolean }> {
  try {
    const transaction = await aptosClient.transaction.build.simple({
      sender: sender.accountAddress,
      data: payload,
    });

    const [simulation] = await aptosClient.transaction.simulate.simple({
      signerPublicKey: sender.publicKey,
      transaction,
    });

    return {
      gasEstimate: simulation.gas_used,
      success: simulation.success,
    };
  } catch (error) {
    return { gasEstimate: "unknown", success: false };
  }
}
