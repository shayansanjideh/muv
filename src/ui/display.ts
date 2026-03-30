import chalk from "chalk";
import type { TokenBalance } from "../chain/balance.js";

export function displayPreview(
  action: string,
  details: Record<string, unknown>
): void {
  console.log("");
  console.log(chalk.yellow("-------------------------------------------"));
  console.log(chalk.bold(`  Transaction Preview: ${action}`));
  console.log(chalk.yellow("-------------------------------------------"));

  for (const [key, value] of Object.entries(details)) {
    if (key === "action") continue;
    const label = formatLabel(key);
    console.log(`  ${chalk.cyan(label.padEnd(16))} ${String(value)}`);
  }

  console.log(chalk.yellow("-------------------------------------------"));
  console.log("");
}

export function displayResult(action: string, txHash: string): void {
  console.log("");
  console.log(chalk.green(`  [ok] ${action} successful!`));
  console.log(chalk.gray(`  TX: ${txHash}`));
  console.log("");
}

export function displayError(message: string): void {
  console.log("");
  console.log(chalk.red(`  [error] ${message}`));
  console.log("");
}

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

export function displayWelcome(showExamples = false): void {
  console.log("");
  console.log(chalk.bold.cyan("  muv") + " — Movement blockchain, plain English");
  console.log("");
  if (showExamples) {
    console.log("  Try something:");
    console.log(chalk.cyan('    "What\'s my MOVE balance?"'));
    console.log(chalk.cyan('    "Show all my balances"'));
    console.log(chalk.cyan('    "Send 5 MOVE to 0x123..."'));
    console.log(chalk.cyan('    "Swap 10 USDC.e for MOVE on Meridian"'));
    console.log("");
  }
  console.log("  Type 'exit' or 'quit' to leave.");
  console.log("");
}

export function displaySetupHeader(): void {
  console.log("");
  console.log(chalk.bold.cyan("  muv") + " — First-time Setup");
  console.log("");
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim() + ":";
}
