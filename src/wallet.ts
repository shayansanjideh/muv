import {
  Account,
  Ed25519PrivateKey,
  type HexInput,
} from "@aptos-labs/ts-sdk";

export function accountFromPrivateKey(privateKeyHex: string): Account {
  const cleaned = privateKeyHex.startsWith("0x")
    ? privateKeyHex
    : `0x${privateKeyHex}`;
  const privateKey = new Ed25519PrivateKey(cleaned as HexInput);
  return Account.fromPrivateKey({ privateKey });
}
