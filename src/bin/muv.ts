#!/usr/bin/env node

const args = process.argv.slice(2);

if (args.includes("--mcp") || args.includes("serve")) {
  // MCP server mode
  import("../server.js").then(({ startServer }) => {
    startServer().catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
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
