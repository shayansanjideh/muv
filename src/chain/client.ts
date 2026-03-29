import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const MOVEMENT_RPC = "https://mainnet.movementnetwork.xyz/v1";

const config = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: MOVEMENT_RPC,
});

export const aptosClient = new Aptos(config);
