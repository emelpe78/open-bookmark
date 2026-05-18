import { describe, expect, it } from "vitest";
import {
  applyTagSuggestion,
  filterTagSuggestions,
  getTagInputState,
} from "../../shared/lib/tagInputComposer";

describe("tagInputComposer", () => {
  it("parses fragment after last comma", () => {
    expect(getTagInputState("nuxt, op")).toMatchObject({
      fragment: "op",
      fragmentNormalized: "op",
      completedTags: ["nuxt"],
    });
  });

  it("filters suggestions by prefix and excludes completed tags", () => {
    const state = getTagInputState("nuxt, op");
    const suggestions = filterTagSuggestions(
      ["nuxt", "open-source", "ops", "docs"],
      state,
    );
    expect(suggestions).toEqual(["open-source", "ops"]);
  });

  it("shows suggestions after comma with empty fragment", () => {
    const state = getTagInputState("nuxt, ");
    const suggestions = filterTagSuggestions(["nuxt", "docs", "seo"], state);
    expect(suggestions).toEqual(["docs", "seo"]);
  });

  it("applies suggestion and positions cursor after comma", () => {
    const { value, cursorPos } = applyTagSuggestion(
      "nuxt, op",
      "open-source",
    );
    expect(value).toBe("nuxt, open-source, ");
    expect(cursorPos).toBe(value.length);
  });
});
