import * as readline from "node:readline";
import { loadConfig, saveConfig, type MuvConfig } from "./config.js";
import { loadWallet, generateWallet, importWallet } from "./wallet.js";
import { ConversationManager } from "./ai/intent.js";

const EXIT_COMMANDS = new Set(["exit", "quit", "q", ".exit"]);

async function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function onboard(rl: readline.Interface): Promise<{ config: MuvConfig; address: string }> {
  console.log("\nWelcome to muv — your natural language interface to Movement.\n");

  // Wallet setup
  console.log("Wallet Setup:");
  console.log("  1) Import an existing private key");
  console.log("  2) Generate a new wallet\n");

  let walletChoice = "";
  while (walletChoice !== "1" && walletChoice !== "2") {
    walletChoice = await prompt(rl, "Choose (1 or 2): ");
  }

  let address: string;
  if (walletChoice === "1") {
    const key = await prompt(rl, "Enter your private key (hex): ");
    const wallet = importWallet(key);
    address = wallet.address;
    console.log(`\nWallet imported: ${address}\n`);
  } else {
    const wallet = generateWallet();
    address = wallet.address;
    console.log(`\nNew wallet generated: ${address}`);
    console.log("Fund this address with MOVE before making transactions.\n");
  }

  // Personality selection
  console.log("Communication Style:");
  console.log("  1) Keep it short / terse");
  console.log("  2) Be conversational / friendly\n");

  let personalityChoice = "";
  while (personalityChoice !== "1" && personalityChoice !== "2") {
    personalityChoice = await prompt(rl, "Choose (1 or 2): ");
  }

  const personality: "terse" | "friendly" =
    personalityChoice === "1" ? "terse" : "friendly";

  const config: MuvConfig = { personality };
  saveConfig(config);

  console.log(`\nPreference saved. Let's go!\n`);
  return { config, address };
}

export async function startRepl(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let config = loadConfig();
  let wallet = loadWallet();

  if (!config || !wallet) {
    const result = await onboard(rl);
    config = result.config;
    wallet = loadWallet()!;
  }

  const conversation = new ConversationManager(config.personality, wallet.address);

  console.log(`muv ready. Wallet: ${wallet.address}`);
  console.log('Type your request in plain English. Type "exit" to quit.\n');

  const loop = (): void => {
    rl.question("muv> ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        loop();
        return;
      }

      if (EXIT_COMMANDS.has(trimmed.toLowerCase())) {
        console.log("Goodbye!");
        rl.close();
        return;
      }

      try {
        const response = await conversation.processInput(trimmed);
        if (response) console.log(`\n${response}\n`);
      } catch (error) {
        console.error(`\nError: ${error}\n`);
      }

      loop();
    });
  };

  loop();
}
