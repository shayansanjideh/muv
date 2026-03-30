import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import {
  loadConfig,
  saveConfig,
  configExists,
  walletExists,
  getConfigDir,
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

function addMcpToClaudeCode(): boolean {
  const claudeConfigPath = path.join(
    process.env.HOME || "/root",
    ".claude.json"
  );

  try {
    let claudeConfig: Record<string, unknown> = {};
    if (fs.existsSync(claudeConfigPath)) {
      claudeConfig = JSON.parse(fs.readFileSync(claudeConfigPath, "utf-8"));
    }

    const projects = (claudeConfig.projects ?? {}) as Record<string, Record<string, unknown>>;
    const cwd = process.cwd();

    if (!projects[cwd]) {
      projects[cwd] = {
        allowedTools: [],
        mcpServers: {},
        hasTrustDialogAccepted: true,
      };
    }

    const mcpServers = (projects[cwd].mcpServers ?? {}) as Record<string, unknown>;
    mcpServers["muv"] = {
      command: "node",
      args: [path.join(cwd, "dist/bin/muv.js"), "--mcp"],
      env: {
        MUV_CONFIG_DIR: getConfigDir(),
      },
    };
    projects[cwd].mcpServers = mcpServers;
    claudeConfig.projects = projects;

    fs.writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2));
    return true;
  } catch {
    return false;
  }
}

async function setupWallet(): Promise<string> {
  if (walletExists()) {
    const wallet = loadWallet();
    console.log(`  Wallet loaded: ${wallet?.address}`);
    return wallet?.address ?? "";
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
    console.log(`  Address: ${data.address}`);
    console.log("");
    console.log(chalk.yellow("  IMPORTANT: Your private key is stored at:"));
    console.log(chalk.yellow("    ~/.config/muv/wallet.json"));
    console.log(chalk.yellow("  Back it up somewhere safe. If you lose it, your funds are gone."));
    return data.address;
  } else {
    const key = await askQuestion(chalk.cyan("  Enter your private key (hex): "));
    if (!key.trim()) {
      console.log(chalk.red("  Private key cannot be empty."));
      process.exit(1);
    }
    try {
      const { data } = importFromPrivateKey(key.trim());
      saveWallet(data);
      console.log("");
      console.log(chalk.green("  Wallet imported!"));
      console.log(`  Address: ${data.address}`);
      return data.address;
    } catch (err) {
      console.log(
        chalk.red(`  Invalid private key: ${err instanceof Error ? err.message : String(err)}`)
      );
      process.exit(1);
    }
  }
}

async function firstRunSetup(): Promise<MuvConfig | null> {
  displaySetupHeader();

  const providerChoice = await askChoice(
    "  How would you like to use muv?",
    [
      "Anthropic API key",
      "OpenAI API key",
      "Claude Pro/Max plan (via Claude Code — no API key needed)",
    ]
  );

  // --- Claude plan: wallet setup + auto-configure MCP ---
  if (providerChoice === 3) {
    console.log("");
    console.log("  Even in Claude Code mode, muv needs a wallet to sign");
    console.log("  transactions on Movement.");

    const walletAddress = await setupWallet();

    console.log("");
    const added = addMcpToClaudeCode();

    if (added) {
      console.log(chalk.green("  Claude Code configured!"));
      console.log("");
      console.log("  What happens next:");
      console.log("  1. Restart Claude Code (or open a new session)");
      console.log("  2. Talk to Claude naturally — it now has Movement superpowers");
      console.log("");
      console.log("  Examples — just type these in Claude Code:");
      console.log(chalk.cyan('    "Check my MOVE balance"'));
      console.log(chalk.cyan('    "What tokens do I have on Movement?"'));
      console.log(chalk.cyan('    "Swap 10 USDC.e for MOVE on Meridian"'));
      console.log(chalk.cyan('    "Send 5 MOVE to 0xabc..."'));
    } else {
      console.log(chalk.yellow("  Could not auto-configure Claude Code."));
      console.log("  Add this to your Claude Code MCP settings manually:");
      console.log("");
      console.log('    "muv": {');
      console.log('      "command": "node",');
      console.log(`      "args": ["${process.cwd()}/dist/bin/muv.js", "--mcp"],`);
      console.log('      "env": {');
      console.log(`        "MUV_CONFIG_DIR": "${getConfigDir()}"`);
      console.log("      }");
      console.log("    }");
      console.log("");
      console.log("  Then restart Claude Code.");
    }

    console.log("");
    console.log(`  Your wallet: ${walletAddress}`);
    console.log(`  Config dir:  ${getConfigDir()}/`);
    console.log("");
    console.log(`  To reconfigure, run: muv --reset`);
    console.log("");

    const config: MuvConfig = {
      personality: "friendly",
      provider: "claude_plan",
      apiKey: "",
    };
    saveConfig(config);

    return null; // signal to exit, not start REPL
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
      console.log("  Using ANTHROPIC_API_KEY from environment.");
    }
  } else {
    provider = "openai";
    apiKey = process.env.OPENAI_API_KEY || "";
    if (!apiKey) {
      apiKey = await askQuestion(chalk.cyan("  Enter your OpenAI API key: "));
    } else {
      console.log("  Using OPENAI_API_KEY from environment.");
    }
  }

  if (!apiKey.trim()) {
    console.log(chalk.red("  API key is required."));
    process.exit(1);
  }
  apiKey = apiKey.trim();

  // Wallet setup
  await setupWallet();

  // Personality
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

async function startRepl(config: MuvConfig, firstRun: boolean): Promise<void> {
  const wallet = loadWallet();
  if (!wallet) {
    console.log(chalk.red("  No wallet configured. Run muv --reset to set up again."));
    process.exit(1);
  }

  displayWelcome(firstRun);

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
        console.log("Goodbye!");
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
          console.log(chalk.red("  API key error. Your key may be invalid or expired."));
          console.log(chalk.red("  Run muv --reset to reconfigure."));
        } else {
          console.log(chalk.red(`  Error: ${msg}`));
        }
      }

      prompt();
    });
  };

  prompt();
}

export async function startCli(): Promise<void> {
  if (!configExists()) {
    const config = await firstRunSetup();
    if (!config) return; // Path 3 exits after setup
    await startRepl(config, true);
    return;
  }

  const config = loadConfig()!;

  // Returning user — Path 3
  if (config.provider === "claude_plan") {
    const wallet = loadWallet();
    const addr = wallet?.address ?? "not configured";
    console.log("");
    console.log(chalk.bold.cyan("  muv") + " is configured for Claude Code (MCP server).");
    console.log("");
    console.log("  Use it by talking to Claude in Claude Code. Examples:");
    console.log(chalk.cyan('    "Check my MOVE balance"'));
    console.log(chalk.cyan('    "Swap 10 USDC.e for MOVE"'));
    console.log("");
    console.log(`  Wallet: ${addr}`);
    console.log("");
    console.log(`  To switch modes:  muv --reset`);
    console.log(`  To start MCP server manually:  muv --mcp`);
    console.log("");
    return;
  }

  // Returning user — Path 1 or 2
  if (config.provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    config.apiKey = process.env.ANTHROPIC_API_KEY;
  }
  if (config.provider === "openai" && process.env.OPENAI_API_KEY) {
    config.apiKey = process.env.OPENAI_API_KEY;
  }

  if (!config.apiKey) {
    console.log(chalk.red("  No API key configured. Run muv --reset to reconfigure."));
    process.exit(1);
  }

  await startRepl(config, false);
}
