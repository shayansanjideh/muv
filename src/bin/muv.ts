#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);

if (args.includes("--mcp") || args.includes("serve")) {
  // MCP server mode (called by Claude Code, not by humans)
  import("../server.js").then(({ startServer }) => {
    startServer().catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
  });
} else if (args.includes("--reset")) {
  // Reset configuration (keeps wallet)
  const configDir = process.env.MUV_CONFIG_DIR || path.join(process.env.HOME || "/root", ".config", "muv");
  const configPath = path.join(configDir, "config.json");

  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
    console.log("");
    console.log("  Configuration cleared. Wallet was NOT deleted.");
    console.log("  Run muv to set up again.");
    console.log("");
  } else {
    console.log("");
    console.log("  No configuration found. Run muv to set up.");
    console.log("");
  }
} else if (args.includes("--reset-all")) {
  // Full reset including wallet — requires confirmation
  const configDir = process.env.MUV_CONFIG_DIR || path.join(process.env.HOME || "/root", ".config", "muv");
  const configPath = path.join(configDir, "config.json");
  const walletPath = path.join(configDir, "wallet.json");

  const readline = await import("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("");
  console.log("  WARNING: This will delete your wallet private key.");
  console.log("  If you haven't backed it up, your funds will be LOST.");
  console.log("");

  rl.question('  Type "yes I understand" to continue: ', (answer) => {
    rl.close();
    if (answer.trim() === "yes I understand") {
      if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
      if (fs.existsSync(walletPath)) fs.unlinkSync(walletPath);
      console.log("");
      console.log("  All muv configuration and wallet data cleared.");
      console.log("  Run muv to set up again.");
      console.log("");
    } else {
      console.log("  Cancelled.");
    }
  });
} else {
  // Interactive CLI mode (default)
  import("../cli.js").then(({ startCli }) => {
    startCli().catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
  });
}
