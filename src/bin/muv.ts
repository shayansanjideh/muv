#!/usr/bin/env node
import { startRepl } from "../index.js";

startRepl().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
