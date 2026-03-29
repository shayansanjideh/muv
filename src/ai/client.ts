import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "../config.js";

let clientInstance: Anthropic | null = null;

export function getAIClient(): Anthropic {
  if (!clientInstance) {
    clientInstance = new Anthropic({ apiKey: getAnthropicApiKey() });
  }
  return clientInstance;
}
