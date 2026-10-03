import { z } from "zod";

/**
 * Shared Zod schemas. Phase 0 defines only the shapes that are already
 * stable (LLM output contracts and SSE payloads). Feature-specific models
 * (documents, evidence, comparisons) land with their phases.
 */

export const documentKindSchema = z.enum(["pdf", "docx"]);
export type DocumentKind = z.infer<typeof documentKindSchema>;

export const chatModeSchema = z.enum(["standard", "agent"]);
export type ChatMode = z.infer<typeof chatModeSchema>;

/** Output of the per-chunk "map" prompt (Appendix A). */
export const mapResultSchema = z.object({
  relevant: z.boolean(),
  quotes: z.array(z.object({ text: z.string() })).max(5),
});
export type MapResult = z.infer<typeof mapResultSchema>;

export const evidenceItemSchema = z.object({
  id: z.string(),
  docId: z.string(),
  docName: z.string(),
  quote: z.string(),
  pages: z.array(z.number().int()),
  occurrences: z.array(
    z.object({
      pageStart: z.number().int(),
      pageEnd: z.number().int(),
      segments: z.array(
        z.object({
          page: z.number().int(),
          text: z.string(),
          ordinal: z.number().int().nonnegative(),
        }),
      ),
    }),
  ),
  primaryOccurrence: z.number().int().nonnegative(),
});
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export const coverageItemSchema = z.object({
  docId: z.string(),
  chunksRead: z.number().int().nonnegative(),
  chunksTotal: z.number().int().nonnegative(),
  pageRangesRead: z.array(z.tuple([z.number().int(), z.number().int()])),
  pagesTotal: z.number().int().nonnegative(),
  unreadablePages: z.array(z.number().int()),
  partial: z.boolean(),
});
export type CoverageItem = z.infer<typeof coverageItemSchema>;
