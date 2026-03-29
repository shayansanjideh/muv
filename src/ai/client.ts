import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

let anthropicInstance: Anthropic | null = null;
let openaiInstance: OpenAI | null = null;

export function getAnthropicClient(apiKey: string): Anthropic {
  if (!anthropicInstance) {
    anthropicInstance = new Anthropic({ apiKey });
  }
  return anthropicInstance;
}

export function getOpenAIClient(apiKey: string): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}
