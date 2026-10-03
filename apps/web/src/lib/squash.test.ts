import { squash } from "@app/shared";
import { describe, expect, it } from "vitest";

describe("shared package integration", () => {
  it("is importable from the web app", () => {
    expect(squash("Hello, World!")).toBe("helloworld");
  });
});
