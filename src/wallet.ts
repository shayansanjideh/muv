import * as fs from "fs";
import {
  Account,
  Ed25519PrivateKey,
  AccountAddress,
  type HexInput,
} from "@aptos-labs/ts-sdk";
import { getWalletPath, ensureConfigDir } from "./config.js";

export interface WalletData {
  address: string;
  privateKey: string;
}

export function loadWallet(): WalletData | null {
  const walletPath = getWalletPath();
  if (!fs.existsSync(walletPath)) return null;
  const raw = fs.readFileSync(walletPath, "utf-8");
  return JSON.parse(raw) as WalletData;
}

export function saveWallet(data: WalletData): void {
  ensureConfigDir();
  const walletPath = getWalletPath();
  fs.writeFileSync(walletPath, JSON.stringify(data, null, 2), {
    mode: 0o600,
  });
}

export function generateWallet(): { account: Account; data: WalletData } {
  const account = Account.generate();
  const data: WalletData = {
    address: account.accountAddress.toString(),
    privateKey: Buffer.from(account.privateKey.toUint8Array()).toString("hex"),
  };
  return { account, data };
}

export function importFromPrivateKey(hexKey: string): {
  account: Account;
  data: WalletData;
} {
  const cleaned = hexKey.startsWith("0x") ? hexKey.slice(2) : hexKey;
  const privateKey = new Ed25519PrivateKey(cleaned as HexInput);
  const account = Account.fromPrivateKey({ privateKey });
  const data: WalletData = {
    address: account.accountAddress.toString(),
    privateKey: cleaned,
  };
  return { account, data };
}

export function accountFromPrivateKey(privateKeyHex: string): Account {
  const cleaned = privateKeyHex.startsWith("0x")
    ? privateKeyHex
    : `0x${privateKeyHex}`;
  const privateKey = new Ed25519PrivateKey(cleaned as HexInput);
  return Account.fromPrivateKey({ privateKey });
}

export function getAccount(): Account {
  const walletData = loadWallet();
  if (!walletData) {
    throw new Error("No wallet configured. Run muv to set up a wallet first.");
  }
  const privateKey = new Ed25519PrivateKey(
    walletData.privateKey as HexInput
  );
  return Account.fromPrivateKey({ privateKey });
}

export function getAddress(): AccountAddress {
  const walletData = loadWallet();
  if (!walletData) {
    throw new Error("No wallet configured. Run muv to set up a wallet first.");
  }
  return AccountAddress.fromString(walletData.address);
}
