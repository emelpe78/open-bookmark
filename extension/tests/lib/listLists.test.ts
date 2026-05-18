import { describe, expect, it, vi } from "vitest";
import { addBookmarksToList, listLists } from "../../src/lib/openBookmarkApi";

describe("lists API", () => {
  it("GETs /api/lists and returns list summaries", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        lists: [{ id: 1, name: "Lesen", count: 2, created_at: "", updated_at: "" }],
      }),
    });

    const lists = await listLists("http://localhost:3777", { fetch: fetchMock });

    expect(lists).toEqual([
      { id: 1, name: "Lesen", count: 2, created_at: "", updated_at: "" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3777/api/lists",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("PATCHes bookmarkIds onto a list", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ list: { id: 1, name: "Lesen", bookmarks: [] } }),
    });

    await addBookmarksToList("http://localhost:3777", 1, [5, 6], {
      fetch: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3777/api/lists/1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ addBookmarkIds: [5, 6] }),
      }),
    );
  });
});
