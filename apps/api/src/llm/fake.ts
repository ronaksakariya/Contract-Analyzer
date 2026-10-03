import type { CompleteJSONOptions, LLM, LLMMessage, ToolCallOptions, ToolCallResult } from "./client.js";

/**
 * Deterministic LLM used by every test and by early UI development.
 * Phase 0 provides the skeleton; behaviour is filled in as the chat pipeline
 * lands (map/synthesis/agent responses).
 */
export function createFakeLLM(): LLM {
  return {
    provider: "fake",

    async completeJSON<T>(_options: CompleteJSONOptions): Promise<T> {
      throw new Error("FakeLLM.completeJSON is not implemented yet (Phase 2).");
    },

    async stream(options: {
      messages: LLMMessage[];
      signal?: AbortSignal;
      onToken: (text: string) => void;
    }): Promise<string> {
      const text = "FakeLLM: not implemented yet (Phase 2).";
      options.onToken(text);
      return text;
    },

    async chatWithTools(_options: ToolCallOptions): Promise<ToolCallResult> {
      return { calls: [], content: "" };
    },
  };
}
