import { describe, expect, it } from "vitest";
import { hasBookmarkFormChanges } from "../../src/lib/bookmarkFormChanges";
import type { Bookmark } from "../../src/lib/types";

const baseBookmark: Bookmark = {
  id: 1,
  url: "https://example.com",
  normalized_url: "https://example.com",
  title: "T",
  description: null,
  image_url: null,
  site_name: null,
  notes: "Alt",
  created_at: "",
  updated_at: "",
  tags: ["nuxt", "docs"],
};

describe("hasBookmarkFormChanges", () => {
  it("returns false when tags and notes are unchanged", () => {
    expect(
      hasBookmarkFormChanges(baseBookmark, "docs, nuxt", "Alt"),
    ).toBe(false);
  });

  it("detects note changes", () => {
    expect(
      hasBookmarkFormChanges(baseBookmark, "nuxt, docs", "Neu"),
    ).toBe(true);
  });

  it("detects tag changes", () => {
    expect(
      hasBookmarkFormChanges(baseBookmark, "nuxt, lesen", "Alt"),
    ).toBe(true);
  });

  it("detects clearing notes", () => {
    expect(hasBookmarkFormChanges(baseBookmark, "nuxt, docs", "")).toBe(true);
  });
});
