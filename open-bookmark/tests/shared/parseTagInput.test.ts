import { describe, expect, it } from "vitest";
import { parseTagInput } from "../../shared/lib/parseTagInput";

describe("parseTagInput", () => {
  it("returns empty array for undefined", () => {
    expect(parseTagInput(undefined)).toEqual([]);
  });

  it("splits comma-separated string and trims", () => {
    expect(parseTagInput("nuxt, docs , lesen")).toEqual(["nuxt", "docs", "lesen"]);
  });

  it("deduplicates tag names", () => {
    expect(parseTagInput("a, a, b")).toEqual(["a", "b"]);
  });

  it("flattens array input with commas", () => {
    expect(parseTagInput(["foo, bar", "baz"])).toEqual(["foo", "bar", "baz"]);
  });
});
