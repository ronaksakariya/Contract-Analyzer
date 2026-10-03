import type { CoverageItem, EvidenceItem } from "./schemas.js";

/**
 * Server-Sent Events emitted by `POST /api/chat`, typed here so the API and
 * the web client share one definition.
 */
export type ChatEvent =
  | { type: "status"; text: string }
  | { type: "tool_call"; name: string; args: unknown; label: string }
  | { type: "tool_result"; name: string; summary: string }
  | { type: "evidence"; items: EvidenceItem[] }
  | { type: "token"; text: string }
  | {
      type: "done";
      messageId: string;
      citedIds: string[];
      coverage: CoverageItem[];
      rejectedCount: number;
    }
  | { type: "error"; message: string };

export type ChatEventType = ChatEvent["type"];
