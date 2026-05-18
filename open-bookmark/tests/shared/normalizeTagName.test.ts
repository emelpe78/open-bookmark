import { describe, expect, it } from "vitest";
import { normalizeTagName } from "../../shared/lib/normalizeTagName";

describe("normalizeTagName", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(normalizeTagName("Marc Lettau-Poelchen")).toBe("marc-lettau-poelchen");
  });

  it("trims and collapses whitespace", () => {
    expect(normalizeTagName("  Docs  ")).toBe("docs");
    expect(normalizeTagName("seo   tips")).toBe("seo-tips");
  });

  it("normalizes underscores like spaces", () => {
    expect(normalizeTagName("foo_bar")).toBe("foo-bar");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeTagName("   ")).toBe("");
  });
});
