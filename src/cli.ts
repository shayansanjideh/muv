import * as readline from "readline";
import chalk from "chalk";
import {
  loadConfig,
  saveConfig,
  configExists,
  walletExists,
  type MuvConfig,
  type Personality,
  type Provider,
} from "./config.js";
import {
  generateWallet,
  importFromPrivateKey,
  saveWallet,
  loadWallet,
} from "./wallet.js";
import { displayWelcome, displaySetupHeader } from "./ui/display.js";
import { askQuestion, askChoice } from "./ui/confirm.js";
import { createSession } from "./ai/intent.js";

async function setupWallet(): Promise<void> {
  if (walletExists()) {
    const wallet = loadWallet();
    console.log(chalk.gray(`  Wallet loaded: ${wallet?.address}`));
    return;
  }

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
}

async function firstRunSetup(): Promise<MuvConfig> {
  displaySetupHeader();

  // Step 1: How are you using muv?
  const providerChoice = await askChoice(
    "  How would you like to use muv?",
    [
      "Anthropic API key",
      "OpenAI API key",
      "Claude Pro/Max plan (via Claude Code — no API key needed)",
    ]
  );

  // --- Claude plan: MCP server mode ---
  if (providerChoice === 3) {
    console.log("");
    console.log(chalk.green("  Got it! Starting muv as an MCP server."));
    console.log("");
    console.log(chalk.gray("  Add this to your Claude Code MCP settings:"));
    console.log("");
    console.log(chalk.white('    "muv": {'));
    console.log(chalk.white('      "command": "node",'));
    console.log(chalk.white(`      "args": ["${process.cwd()}/dist/bin/muv.js", "--mcp"]`));
    console.log(chalk.white("    }"));
    console.log("");

    const config: MuvConfig = {
      personality: "friendly",
      provider: "claude_plan",
      apiKey: "",
    };
    saveConfig(config);

    const { startServer } = await import("./server.js");
    await startServer();
    process.exit(0);
  }

  // --- API key modes ---
  let provider: Provider;
  let apiKey: string;

  if (providerChoice === 1) {
    provider = "anthropic";
    apiKey = process.env.ANTHROPIC_API_KEY || "";
    if (!apiKey) {
      apiKey = await askQuestion(chalk.cyan("  Enter your Anthropic API key: "));
    } else {
      console.log(chalk.gray("  Using ANTHROPIC_API_KEY from environment."));
    }
  } else if (providerChoice === 2) {
    provider = "openai";
    apiKey = process.env.OPENAI_API_KEY || "";
    if (!apiKey) {
      apiKey = await askQuestion(chalk.cyan("  Enter your OpenAI API key: "));
    } else {
      console.log(chalk.gray("  Using OPENAI_API_KEY from environment."));
    }
  } else {
    console.log(chalk.red("  Invalid choice. Exiting."));
    process.exit(1);
  }

  if (!apiKey.trim()) {
    console.log(chalk.red("  API key is required."));
    process.exit(1);
  }
  apiKey = apiKey.trim();

  // Step 2: Wallet
  await setupWallet();

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
    provider,
    apiKey,
  };
  saveConfig(config);

  console.log("");
  console.log(chalk.green("  Setup complete!"));
  return config;
}

async function startRepl(config: MuvConfig): Promise<void> {
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
    config.provider,
    config.personality,
    wallet.address,
    config.apiKey
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
        const response = await session.processInput(trimmed);
        if (response) {
          console.log("");
          console.log(response);
          console.log("");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("authentication") || msg.includes("api_key") || msg.includes("Incorrect API")) {
          console.log(chalk.red("API key error. Check your key or delete ~/.config/muv/config.json to re-run setup."));
        } else {
          console.log(chalk.red(`Error: ${msg}`));
        }
      }

      prompt();
    });
  };

  prompt();
}

export async function startCli(): Promise<void> {
  let config: MuvConfig;

  if (!configExists()) {
    config = await firstRunSetup();
  } else {
    config = loadConfig()!;

    // If they previously chose Claude plan, go straight to MCP server
    if (config.provider === "claude_plan") {
      const { startServer } = await import("./server.js");
      await startServer();
      return;
    }

    // Allow env var override
    if (config.provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      config.apiKey = process.env.ANTHROPIC_API_KEY;
    }
    if (config.provider === "openai" && process.env.OPENAI_API_KEY) {
      config.apiKey = process.env.OPENAI_API_KEY;
    }
  }

  if (!config.apiKey) {
    console.log(
      chalk.red(
        "No API key configured. Delete ~/.config/muv/config.json to re-run setup."
      )
    );
    process.exit(1);
  }

  await startRepl(config);
}
