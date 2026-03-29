import * as fs from "fs";
import * as path from "path";

export type Personality = "terse" | "friendly";
export type AuthMethod = "api_key" | "max_plan";

export interface MuvConfig {
  personality: Personality;
  authMethod: AuthMethod;
  anthropicApiKey: string;
}

export function getConfigDir(): string {
  return process.env.MUV_CONFIG_DIR || path.join(homedir(), ".config", "muv");
}

function homedir(): string {
  return process.env.HOME || process.env.USERPROFILE || "/root";
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), "config.json");
}

export function getWalletPath(): string {
  return path.join(getConfigDir(), "wallet.json");
}

export function ensureConfigDir(): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

export function loadConfig(): MuvConfig | null {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return null;
  const raw = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as MuvConfig;
}

export function saveConfig(config: MuvConfig): void {
  ensureConfigDir();
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), {
    mode: 0o600,
  });
}

export function configExists(): boolean {
  return fs.existsSync(getConfigPath());
}

export function walletExists(): boolean {
  return fs.existsSync(getWalletPath());
}
