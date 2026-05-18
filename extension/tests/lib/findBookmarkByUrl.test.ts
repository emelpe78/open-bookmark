import { describe, expect, it, vi } from "vitest";
import {
  findBookmarkByUrl,
  pickExactBookmarkMatch,
} from "../../src/lib/findBookmarkByUrl";

const items = [
  {
    id: 1,
    url: "https://example.com/page",
    normalized_url: "https://example.com/page",
    title: "A",
    description: null,
    image_url: null,
    site_name: null,
    notes: null,
    created_at: "",
    updated_at: "",
    tags: [],
  },
  {
    id: 2,
    url: "https://other.com",
    normalized_url: "https://other.com",
    title: "B",
    description: null,
    image_url: null,
    site_name: null,
    notes: null,
    created_at: "",
    updated_at: "",
    tags: [],
  },
];

describe("pickExactBookmarkMatch", () => {
  it("finds bookmark by exact url", () => {
    expect(
      pickExactBookmarkMatch(items, "https://example.com/page"),
    ).toEqual(items[0]);
  });

  it("returns null when no exact match", () => {
    expect(
      pickExactBookmarkMatch(items, "https://example.com/other"),
    ).toBeNull();
  });
});

describe("findBookmarkByUrl", () => {
  it("searches API and returns exact match", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items,
        total: 2,
        page: 1,
        pageSize: 25,
      }),
    });

    const bookmark = await findBookmarkByUrl(
      "http://localhost:3777",
      "https://example.com/page",
      { fetch: fetchMock },
    );

    expect(bookmark?.id).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/bookmarks?"),
      expect.any(Object),
    );
  });
});
