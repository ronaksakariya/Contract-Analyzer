import { config } from "../config.js";
import { createFakeLLM } from "./fake.js";

/**
 * Provider-agnostic LLM surface. The real OpenAI-compatible client and the
 * deterministic `FakeLLM` both implement this interface, so tests and early
 * UI work never burn quota.
 */
export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface CompleteJSONOptions {
  /** JSON shape (Zod schema) described to the model and validated on return. */
  schema: unknown;
  messages: LLMMessage[];
  signal?: AbortSignal;
}

export interface ToolCallOptions {
  messages: LLMMessage[];
  tools: unknown[];
  signal?: AbortSignal;
}

export interface ToolCallResult {
  /** Raw JSON arguments string per tool call, as returned by the model. */
  calls: { id: string; name: string; arguments: string }[];
  /** Any plain-text content returned alongside tool calls. */
  content: string;
}

export interface LLM {
  readonly provider: string;
  completeJSON<T>(options: CompleteJSONOptions): Promise<T>;
  stream(options: {
    messages: LLMMessage[];
    signal?: AbortSignal;
    onToken: (text: string) => void;
  }): Promise<string>;
  chatWithTools(options: ToolCallOptions): Promise<ToolCallResult>;
}

/** Create the configured LLM implementation. */
export function createLLM(): LLM {
  if (config.llm.provider === "fake") {
    return createFakeLLM();
  }
  // The real OpenAI-compatible client is added in Phase 2.
  throw new Error(
    "The openai-compatible LLM client is not implemented yet. Set LLM_PROVIDER=fake for now.",
  );
}
