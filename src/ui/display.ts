import type { TokenBalance } from "../chain/balance.js";

export function displayBalances(balances: TokenBalance[]): string {
  if (balances.length === 0) {
    return "No token balances found.";
  }

  const lines = ["Your balances:", ""];
  const maxSymbolLen = Math.max(...balances.map((b) => b.token.symbol.length));

  for (const bal of balances) {
    const symbol = bal.token.symbol.padEnd(maxSymbolLen);
    lines.push(`  ${symbol}  ${bal.formatted}`);
  }

  return lines.join("\n");
}

export function displayTransactionPreview(params: {
  action: string;
  details: Record<string, string>;
  gasEstimate?: string;
}): string {
  const lines = [`Transaction Preview: ${params.action}`, ""];

  for (const [key, value] of Object.entries(params.details)) {
    lines.push(`  ${key}: ${value}`);
  }

  if (params.gasEstimate) {
    lines.push(`  Estimated gas: ${params.gasEstimate}`);
  }

  lines.push("");
  lines.push("Confirm? (y/n)");

  return lines.join("\n");
}

export function displaySuccess(txHash: string): string {
  return `Transaction successful! Hash: ${txHash}`;
}

export function displayError(message: string): string {
  return `Error: ${message}`;
}
