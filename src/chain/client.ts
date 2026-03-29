import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const MOVEMENT_RPC = "https://mainnet.movementnetwork.xyz/v1";

const MOVEMENT_INDEXER = "https://indexer.mainnet.movementnetwork.xyz/v1/graphql";

const config = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: MOVEMENT_RPC,
  indexer: MOVEMENT_INDEXER,
});

export const aptosClient = new Aptos(config);
