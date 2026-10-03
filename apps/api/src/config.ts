import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { z } from "zod";

/**
 * Resolve the repository root `.env`.
 *
 * This file lives at `apps/api/src/config.ts`. The root `.env` sits two
 * levels above the `apps/api` package: `apps/api` -> `apps` -> repo root.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(here, ".."); // apps/api
const repoRoot = path.resolve(apiDir, "../.."); // repository root
export const ENV_PATH = path.join(repoRoot, ".env");

// `dotenv` never overrides variables already present in `process.env`, so real
// environment variables (CI, Render) stay authoritative over the file.
if (existsSync(ENV_PATH)) {
  dotenv.config({ path: ENV_PATH });
}

/** Treat an empty string as "not provided" so defaults still apply. */
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/** A number with a fallback used for empty/undefined input. */
const numberWithDefault = (defaultValue: number) =>
  z
    .preprocess(emptyToUndefined, z.coerce.number().int().optional())
    .transform((value) => value ?? defaultValue);

/** A string with a fallback used for empty/undefined input. */
const stringWithDefault = (defaultValue: string) =>
  z
    .preprocess(emptyToUndefined, z.string().optional())
    .transform((value) => value ?? defaultValue);

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

/** Optional JSON object (e.g. LLM_EXTRA_PARAMS), parsed from a string. */
const optionalJsonObject = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) return {};
      try {
        const parsed = JSON.parse(value);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          ctx.addIssue({ code: "custom", message: "must be a JSON object" });
          return z.NEVER;
        }
        return parsed as Record<string, unknown>;
      } catch {
        ctx.addIssue({ code: "custom", message: "must be valid JSON" });
        return z.NEVER;
      }
    }),
);

const envSchema = z.object({
  // --- API ---
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(65535).optional(),
  ).transform((value) => value ?? 4000),
  MONGODB_URI: optionalString,
  CORS_ORIGIN: stringWithDefault("http://localhost:3000"),
  MAX_UPLOAD_MB: numberWithDefault(25),
  MAX_DOCUMENTS: numberWithDefault(40),

  // --- LLM (OpenAI-compatible; Gemini via AI Studio) ---
  LLM_PROVIDER: z
    .preprocess(emptyToUndefined, z.enum(["openai-compatible", "fake"]).optional())
    .transform((value) => value ?? "fake"),
  LLM_BASE_URL: optionalString,
  LLM_API_KEY: optionalString,
  LLM_MODEL: optionalString,
  LLM_CONCURRENCY: numberWithDefault(3),
  LLM_RPM: numberWithDefault(8),
  LLM_MAX_RETRIES: numberWithDefault(4),
  LLM_EXTRA_PARAMS: optionalJsonObject,

  // --- Pipeline ---
  CHUNK_CHARS: numberWithDefault(50_000),
  CHUNK_OVERLAP: numberWithDefault(1_500),
  MAX_EVIDENCE: numberWithDefault(20),
  MIN_QUOTE_SQUASHED_CHARS: numberWithDefault(20),

  // --- Agent (Part C) ---
  AGENT_MAX_ROUNDS: numberWithDefault(6),
  AGENT_MAX_TOOL_CALLS: numberWithDefault(15),
  AGENT_TIMEOUT_MS: numberWithDefault(90_000),
  AGENT_MAX_CONTEXT_CHARS: numberWithDefault(120_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  console.error(
    `Invalid environment configuration. Check ${ENV_PATH} against .env.example:\n${issues}`,
  );
  process.exit(1);
}

const env = parsed.data;

/** Validated, typed application configuration. */
export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  port: env.PORT,
  mongodbUri: env.MONGODB_URI,
  corsOrigin: env.CORS_ORIGIN,
  maxUploadMb: env.MAX_UPLOAD_MB,
  maxDocuments: env.MAX_DOCUMENTS,
  llm: {
    provider: env.LLM_PROVIDER,
    baseUrl: env.LLM_BASE_URL,
    apiKey: env.LLM_API_KEY,
    model: env.LLM_MODEL,
    concurrency: env.LLM_CONCURRENCY,
    rpm: env.LLM_RPM,
    maxRetries: env.LLM_MAX_RETRIES,
    extraParams: env.LLM_EXTRA_PARAMS,
  },
  pipeline: {
    chunkChars: env.CHUNK_CHARS,
    chunkOverlap: env.CHUNK_OVERLAP,
    maxEvidence: env.MAX_EVIDENCE,
    minQuoteSquashedChars: env.MIN_QUOTE_SQUASHED_CHARS,
  },
  agent: {
    maxRounds: env.AGENT_MAX_ROUNDS,
    maxToolCalls: env.AGENT_MAX_TOOL_CALLS,
    timeoutMs: env.AGENT_TIMEOUT_MS,
    maxContextChars: env.AGENT_MAX_CONTEXT_CHARS,
  },
} as const;

export type AppConfig = typeof config;
