/**
 * Pure highlighting helpers shared by server and client (Phase 3).
 *
 * The DOM glue lives in the web app; this module only maps a squashed
 * segment (with an ordinal for duplicates) to a range in a squashed stream.
 * Kept as a Phase 0 stub so the package surface is stable.
 */

export interface HighlightSegment {
  /** Squashed text of the segment to find. */
  text: string;
  /** Which occurrence of `text` to select (0-based). */
  ordinal: number;
}

/**
 * Locate the `ordinal`-th occurrence of `segment.text` in a squashed string.
 * Returns the `[start, end)` squashed indices, or `null` when not found.
 */
export function findSegment(
  squashed: string,
  segment: HighlightSegment,
): { start: number; end: number } | null {
  if (segment.text.length === 0 || segment.ordinal < 0) return null;

  let from = 0;
  for (let found = 0; found <= segment.ordinal; found++) {
    const at = squashed.indexOf(segment.text, from);
    if (at === -1) return null;
    if (found === segment.ordinal) {
      return { start: at, end: at + segment.text.length };
    }
    from = at + 1;
  }
  return null;
}
