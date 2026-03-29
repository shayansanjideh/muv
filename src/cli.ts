import * as readline from "readline";
import chalk from "chalk";
import {
  loadConfig,
  saveConfig,
  configExists,
  walletExists,
  type MuvConfig,
  type Personality,
  type AuthMethod,
} from "./config.js";
import {
  generateWallet,
  importFromPrivateKey,
  saveWallet,
  loadWallet,
} from "./wallet.js";
import { displayWelcome, displaySetupHeader } from "./ui/display.js";
import { askQuestion, askChoice } from "./ui/confirm.js";
import { createSession, processUserInput } from "./ai/intent.js";

async function firstRunSetup(): Promise<MuvConfig> {
  displaySetupHeader();

  // Step 1: Auth method
  let apiKey = process.env.ANTHROPIC_API_KEY || "";
  let authMethod: AuthMethod = "api_key";

  if (!apiKey) {
    const authChoice = await askChoice(
      "  How would you like to authenticate?",
      [
        "API Key — enter your Anthropic API key",
        "Max Plan — use your Anthropic Max subscription",
      ]
    );

    if (authChoice === 1) {
      authMethod = "api_key";
      apiKey = await askQuestion(
        chalk.cyan("  Enter your Anthropic API key: ")
      );
    } else if (authChoice === 2) {
      authMethod = "max_plan";
      console.log("");
      console.log(
        chalk.gray(
          "  Get your API key from your Max plan dashboard at console.anthropic.com"
        )
      );
      apiKey = await askQuestion(
        chalk.cyan("  Enter your Max plan API key: ")
      );
    } else {
      console.log(chalk.red("  Invalid choice. Exiting."));
      process.exit(1);
    }

    if (!apiKey.trim()) {
      console.log(chalk.red("  API key is required."));
      process.exit(1);
    }
    apiKey = apiKey.trim();
  } else {
    console.log(chalk.gray("  Using ANTHROPIC_API_KEY from environment."));
  }

  // Step 2: Wallet
  if (!walletExists()) {
    console.log("");
    const walletChoice = await askChoice(
      "  How would you like to set up your wallet?",
      [
        "Generate a new wallet",
        "Import an existing private key",
      ]
    );

    if (walletChoice === 1) {
      const { data } = generateWallet();
      saveWallet(data);
      console.log("");
      console.log(chalk.green("  New wallet generated!"));
      console.log(chalk.gray(`  Address: ${data.address}`));
      console.log(
        chalk.yellow(
          "  Warning: Back up your private key from ~/.config/muv/wallet.json"
        )
      );
    } else if (walletChoice === 2) {
      const key = await askQuestion(
        chalk.cyan("  Enter your private key (hex): ")
      );
      try {
        const { data } = importFromPrivateKey(key.trim());
        saveWallet(data);
        console.log("");
        console.log(chalk.green("  Wallet imported!"));
        console.log(chalk.gray(`  Address: ${data.address}`));
      } catch (err) {
        console.log(
          chalk.red(
            `  Invalid private key: ${err instanceof Error ? err.message : String(err)}`
          )
        );
        process.exit(1);
      }
    } else {
      console.log(chalk.red("  Invalid choice. Exiting."));
      process.exit(1);
    }
  } else {
    const wallet = loadWallet();
    console.log(chalk.gray(`  Wallet loaded: ${wallet?.address}`));
  }

  // Step 3: Personality
  console.log("");
  const personalityChoice = await askChoice(
    "  Choose your communication style:",
    [
      "Keep it short (terse, minimal output)",
      "Be conversational (friendly, detailed)",
    ]
  );

  const personality: Personality =
    personalityChoice === 1 ? "terse" : "friendly";

  const config: MuvConfig = {
    personality,
    authMethod,
    anthropicApiKey: apiKey,
  };
  saveConfig(config);

  console.log("");
  console.log(chalk.green("  Setup complete!"));
  return config;
}

export async function startCli(): Promise<void> {
  let config: MuvConfig;

  if (!configExists()) {
    config = await firstRunSetup();
  } else {
    config = loadConfig()!;
    if (process.env.ANTHROPIC_API_KEY) {
      config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    }
  }

  if (!config.anthropicApiKey) {
    console.log(
      chalk.red(
        "No API key configured. Set ANTHROPIC_API_KEY or delete ~/.config/muv/config.json to re-run setup."
      )
    );
    process.exit(1);
  }

  const wallet = loadWallet();
  if (!wallet) {
    console.log(
      chalk.red(
        "No wallet configured. Delete ~/.config/muv/config.json and re-run muv."
      )
    );
    process.exit(1);
  }

  displayWelcome();

  const session = createSession(
    config.personality,
    wallet.address,
    config.anthropicApiKey
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (): void => {
    rl.question(chalk.cyan("muv> "), async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        console.log(chalk.gray("Goodbye!"));
        rl.close();
        return;
      }

      try {
        const response = await processUserInput(session, trimmed);
        if (response) {
          console.log("");
          console.log(response);
          console.log("");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("authentication") || msg.includes("api_key")) {
          console.log(
            chalk.red("API key error. Check your ANTHROPIC_API_KEY.")
          );
        } else {
          console.log(chalk.red(`Error: ${msg}`));
        }
      }

      prompt();
    });
  };

  prompt();
}
