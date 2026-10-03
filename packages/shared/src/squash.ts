/**
 * "Squashing" is the heart of quote verification and highlighting.
 *
 * The same function runs on the server (verifier) and in the browser
 * (highlighting), so it must never be forked.
 *
 * `squashWithMap` returns:
 *  - `text`: letters/digits only (plus currency symbols and digit separators),
 *    NFKC-normalised and lowercased, with all whitespace/punctuation dropped.
 *  - `map`: `map[k]` = the raw code-unit index of the raw character that
 *    produced squashed character `k`.
 */

const KEEP_SYMBOLS = new Set(["%", "$", "\u20AC", "\u00A3", "\u00A5", "\u20B9"]); // % $ € £ ¥ ₹

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const DIGIT = /\p{N}/u;

/** True when `ch` is a Unicode letter or number. */
export function isLetterOrDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch.length > 0 && LETTER_OR_DIGIT.test(ch);
}

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch.length > 0 && DIGIT.test(ch);
}

export interface SquashResult {
  text: string;
  map: number[];
}

export function squashWithMap(raw: string): SquashResult {
  // Collect raw code points together with their code-unit start index.
  const rawChars: { cp: string; index: number }[] = [];
  let index = 0;
  for (const cp of raw) {
    rawChars.push({ cp, index });
    index += cp.length;
  }

  const outChars: string[] = [];
  const map: number[] = [];

  for (let p = 0; p < rawChars.length; p++) {
    const current = rawChars[p];
    if (current === undefined) continue;

    const prevRaw = rawChars[p - 1]?.cp;
    const nextRaw = rawChars[p + 1]?.cp;

    // NFKC folds ligatures (e.g. "ﬁ" -> "fi") and full-width forms.
    const normalized = current.cp.normalize("NFKC").toLowerCase();

    for (const ch of normalized) {
      if (isLetterOrDigit(ch) || KEEP_SYMBOLS.has(ch)) {
        outChars.push(ch);
        map.push(current.index);
        continue;
      }
      // Keep "." or "," only when it separates two digits, so "1,000,000"
      // and "1.2" retain their separators (and "1.2" can never equal "12").
      if ((ch === "." || ch === ",") && isDigit(prevRaw) && isDigit(nextRaw)) {
        outChars.push(ch);
        map.push(current.index);
      }
    }
  }

  return { text: outChars.join(""), map };
}

/** Convenience wrapper returning only the squashed text. */
export function squash(raw: string): string {
  return squashWithMap(raw).text;
}

/** Length in code units of the raw code point starting at `rawIndex`. */
function rawCodePointLength(raw: string, rawIndex: number): number {
  const cp = raw.codePointAt(rawIndex);
  if (cp === undefined) return 1;
  return cp > 0xffff ? 2 : 1;
}

/**
 * Boundary rule: prevents a quote from matching only the front of a longer
 * token or number. After a squashed match `[s, e)` we inspect the raw text
 * just outside the matched span and reject the match when:
 *  - the neighbouring raw char is a letter/digit, or
 *  - it is "."/"," followed by a digit while the matched edge char is a digit.
 */
export function isBoundaryOk(raw: string, map: number[], s: number, e: number): boolean {
  if (s < 0 || e > map.length || s >= e) return false;

  const firstRawIndex = map[s];
  const lastRawIndex = map[e - 1];
  if (firstRawIndex === undefined || lastRawIndex === undefined) return false;

  const firstSquashed = raw[firstRawIndex];
  const lastSquashed = raw[lastRawIndex];

  // --- Check the character before the start ---
  const beforeIndex = firstRawIndex - 1;
  const before = beforeIndex >= 0 ? raw[beforeIndex] : undefined;
  if (isLetterOrDigit(before)) return false;
  if (
    (before === "." || before === ",") &&
    isDigit(firstSquashed) &&
    isDigit(beforeIndex - 1 >= 0 ? raw[beforeIndex - 1] : undefined)
  ) {
    return false;
  }

  // --- Check the character after the end ---
  const afterIndex = lastRawIndex + rawCodePointLength(raw, lastRawIndex);
  const after = afterIndex < raw.length ? raw[afterIndex] : undefined;
  if (isLetterOrDigit(after)) return false;
  if (
    (after === "." || after === ",") &&
    isDigit(lastSquashed) &&
    isDigit(afterIndex + 1 < raw.length ? raw[afterIndex + 1] : undefined)
  ) {
    return false;
  }

  return true;
}
