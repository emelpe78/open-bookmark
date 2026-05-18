import { describe, expect, it, vi } from "vitest";
import { listTags } from "../../src/lib/openBookmarkApi";

describe("listTags", () => {
  it("GETs /api/tags and returns tag list", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tags: [
          { id: 1, name: "nuxt", count: 3 },
          { id: 2, name: "docs", count: 1 },
        ],
      }),
    });

    const tags = await listTags("http://localhost:3777", { fetch: fetchMock });

    expect(tags).toEqual([
      { id: 1, name: "nuxt", count: 3 },
      { id: 2, name: "docs", count: 1 },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3777/api/tags",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
