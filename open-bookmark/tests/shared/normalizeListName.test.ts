import { describe, expect, it } from "vitest";
import { normalizeListName } from "../../shared/lib/normalizeListName";

describe("normalizeListName", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeListName("  Lesen   Liste  ")).toBe("Lesen Liste");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeListName("   ")).toBe("");
  });
});
