import { describe, expect, it } from "vitest";

import { isBoundaryOk, squash, squashWithMap } from "./squash.js";

describe("squash", () => {
  it("ignores whitespace, newlines and punctuation", () => {
    expect(squash("The   Company\n\nshall  pay.")).toBe("thecompanyshallpay");
  });

  it("joins hyphenated line breaks", () => {
    expect(squash("termi-\nnation")).toBe("termination");
  });

  it("treats curly and straight quotes the same", () => {
    expect(squash("the \u201CCompany\u201D")).toBe(squash('the "Company"'));
  });

  it("folds ligatures and full-width forms (NFKC)", () => {
    expect(squash("of\ufb01ce")).toBe("office");
    expect(squash("\uff21\uff22\uff23")).toBe("abc");
  });

  it("keeps digit separators but never conflates different numbers", () => {
    expect(squash("1,000,000")).toBe("1,000,000");
    expect(squash("1.2")).toBe("1.2");
    expect(squash("1,000,000")).not.toBe(squash("1000000"));
    expect(squash("1.2")).not.toBe(squash("12"));
  });

  it("maps squashed indices back to raw indices", () => {
    const raw = "A B";
    const { text, map } = squashWithMap(raw);
    expect(text).toBe("ab");
    expect(map).toEqual([0, 2]);
    expect(raw[map[0] as number]).toBe("A");
    expect(raw[map[1] as number]).toBe("B");
  });
});

describe("isBoundaryOk", () => {
  it("keeps separators, so a different number never matches in the first place", () => {
    // "AED 100,000" is not a substring of the squashed "AED 1,000,000".
    expect(squash("the cap is AED 1,000,000").includes(squash("AED 100,000"))).toBe(false);
  });

  it("rejects a match that only covers the front of a longer number", () => {
    const raw = "the cap is AED 1,000,000 in total";
    const { text, map } = squashWithMap(raw);
    const quote = squash("AED 1"); // prefix of "aed1,000,000"
    const s = text.indexOf(quote);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(isBoundaryOk(raw, map, s, s + quote.length)).toBe(false);
  });

  it("accepts a whole number followed by a sentence end", () => {
    const raw = "the cap is AED 1,000,000. done";
    const { text, map } = squashWithMap(raw);
    const quote = squash("AED 1,000,000");
    const s = text.indexOf(quote);
    expect(isBoundaryOk(raw, map, s, s + quote.length)).toBe(true);
  });

  it("rejects a match in the middle of a word", () => {
    const raw = "termination clause";
    const { text, map } = squashWithMap(raw);
    const quote = squash("term");
    const s = text.indexOf(quote);
    expect(isBoundaryOk(raw, map, s, s + quote.length)).toBe(false);
  });
});
