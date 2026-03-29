import * as fs from "node:fs";
import * as path from "node:path";
import {
  Account,
  Ed25519PrivateKey,
  AccountAddress,
  type HexInput,
} from "@aptos-labs/ts-sdk";
import { getConfigDir } from "./config.js";

export interface WalletData {
  privateKey: string;
  address: string;
}

const WALLET_PATH = path.join(getConfigDir(), "wallet.json");

export function loadWallet(): WalletData | null {
  try {
    const data = fs.readFileSync(WALLET_PATH, "utf-8");
    return JSON.parse(data) as WalletData;
  } catch {
    return null;
  }
}

export function saveWallet(wallet: WalletData): void {
  fs.mkdirSync(path.dirname(WALLET_PATH), { recursive: true });
  fs.writeFileSync(WALLET_PATH, JSON.stringify(wallet, null, 2), "utf-8");
}

export function generateWallet(): WalletData {
  const account = Account.generate();
  const wallet: WalletData = {
    privateKey: account.privateKey.toString(),
    address: account.accountAddress.toString(),
  };
  saveWallet(wallet);
  return wallet;
}

export function importWallet(privateKeyHex: string): WalletData {
  const cleaned = privateKeyHex.startsWith("0x")
    ? privateKeyHex
    : `0x${privateKeyHex}`;
  const privateKey = new Ed25519PrivateKey(cleaned as HexInput);
  const account = Account.fromPrivateKey({ privateKey });
  const wallet: WalletData = {
    privateKey: cleaned,
    address: account.accountAddress.toString(),
  };
  saveWallet(wallet);
  return wallet;
}

export function getAccount(): Account {
  const wallet = loadWallet();
  if (!wallet) {
    throw new Error("No wallet found. Please run muv to set up your wallet.");
  }
  const privateKey = new Ed25519PrivateKey(wallet.privateKey as HexInput);
  return Account.fromPrivateKey({ privateKey });
}

export function getAddress(): AccountAddress {
  const wallet = loadWallet();
  if (!wallet) {
    throw new Error("No wallet found. Please run muv to set up your wallet.");
  }
  return AccountAddress.fromString(wallet.address);
}
