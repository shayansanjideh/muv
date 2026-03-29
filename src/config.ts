import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface MuvConfig {
  personality: "terse" | "friendly";
  anthropicApiKey?: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".config", "muv");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

function ensureConfigDir(): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

export function loadConfig(): MuvConfig | null {
  try {
    const data = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(data) as MuvConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: MuvConfig): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function getAnthropicApiKey(): string {
  const config = loadConfig();
  const key = config?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error(
      "Error: No Anthropic API key found. Set ANTHROPIC_API_KEY environment variable or run muv setup."
    );
    process.exit(1);
  }
  return key;
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}
