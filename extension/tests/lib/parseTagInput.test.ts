import { describe, expect, it } from "vitest";
import { parseTagInput } from "../../src/lib/parseTagInput";

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
});
