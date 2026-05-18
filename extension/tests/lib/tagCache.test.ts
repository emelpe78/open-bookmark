import { describe, expect, it } from "vitest";
import { isTagCacheFresh, TAG_CACHE_TTL_MS } from "../../src/lib/tagCache";

describe("isTagCacheFresh", () => {
  it("returns true within TTL", () => {
    const now = 1_000_000;
    expect(isTagCacheFresh(now - 1000, now, TAG_CACHE_TTL_MS)).toBe(true);
  });

  it("returns false when expired", () => {
    const now = 1_000_000;
    expect(isTagCacheFresh(now - TAG_CACHE_TTL_MS - 1, now)).toBe(false);
  });
});
