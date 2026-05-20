import { describe, expect, it } from "vitest";
import { parseTagInput } from "../../../packages/tag-utils/src/parseTagInput";

describe("parseTagInput", () => {
  it("parses comma-separated string", () => {
    expect(parseTagInput("nuxt, docs, lesen")).toEqual([
      "nuxt",
      "docs",
      "lesen",
    ]);
  });

  it("deduplicates tags", () => {
    expect(parseTagInput("nuxt, nuxt")).toEqual(["nuxt"]);
  });

  it("returns empty array for empty input", () => {
    expect(parseTagInput("")).toEqual([]);
    expect(parseTagInput(undefined)).toEqual([]);
  });

  it("normalizes tag names", () => {
    expect(parseTagInput("SEO Tips, Marc Lettau")).toEqual([
      "seo-tips",
      "marc-lettau",
    ]);
  });
});
