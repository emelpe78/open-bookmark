import { describe, expect, it } from "vitest";
import {
  applyTagSuggestion,
  filterTagSuggestions,
  getTagInputState,
} from "../../../packages/tag-utils/src/tagInputComposer";

describe("tagInputComposer (extension)", () => {
  it("suggests after comma", () => {
    const state = getTagInputState("nuxt, ");
    expect(filterTagSuggestions(["nuxt", "docs"], state)).toEqual(["docs"]);
  });

  it("applies suggestion with trailing comma", () => {
    const { value } = applyTagSuggestion("seo, ag", "agentur");
    expect(value).toBe("seo, agentur, ");
    expect(value.endsWith(", ")).toBe(true);
  });
});
