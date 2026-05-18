import { beforeEach, describe, expect, it, vi } from "vitest";
import { findBookmarkByUrl } from "../../src/lib/findBookmarkByUrl";
import {
  addBookmarksToList,
  createBookmark,
  updateBookmark,
} from "../../src/lib/openBookmarkApi";
import { saveOrUpdateBookmark } from "../../src/lib/saveBookmark";
import { OpenBookmarkApiError } from "../../src/lib/types";

vi.mock("../../src/lib/config", () => ({
  getServerBaseUrl: vi.fn().mockResolvedValue("http://localhost:3777"),
  requestHostPermissionForBaseUrl: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../src/lib/findBookmarkByUrl", () => ({
  findBookmarkByUrl: vi.fn(),
}));

vi.mock("../../src/lib/openBookmarkApi", () => ({
  createBookmark: vi.fn(),
  updateBookmark: vi.fn(),
  addBookmarksToList: vi.fn().mockResolvedValue(undefined),
}));

const existing = {
  id: 5,
  url: "https://example.com",
  normalized_url: "https://example.com",
  title: "T",
  description: null,
  image_url: null,
  site_name: null,
  notes: "Alt",
  created_at: "",
  updated_at: "",
  tags: ["nuxt"],
};

const updated = { ...existing, notes: "Neu", tags: ["nuxt", "docs"] };

describe("saveOrUpdateBookmark", () => {
  beforeEach(() => {
    vi.mocked(findBookmarkByUrl).mockReset();
    vi.mocked(createBookmark).mockReset();
    vi.mocked(updateBookmark).mockReset();
  });

  it("creates when bookmark does not exist", async () => {
    vi.mocked(findBookmarkByUrl).mockResolvedValue(null);
    vi.mocked(createBookmark).mockResolvedValue(existing);

    const result = await saveOrUpdateBookmark("https://example.com", {
      tags: "nuxt",
      notes: "Alt",
    });

    expect(result.created).toBe(true);
    expect(result.updated).toBe(false);
    expect(createBookmark).toHaveBeenCalled();
    expect(updateBookmark).not.toHaveBeenCalled();
  });

  it("updates when bookmark exists and form changed", async () => {
    vi.mocked(findBookmarkByUrl).mockResolvedValue(existing);
    vi.mocked(updateBookmark).mockResolvedValue(updated);

    const result = await saveOrUpdateBookmark("https://example.com", {
      tags: "nuxt, docs",
      notes: "Neu",
    });

    expect(result.updated).toBe(true);
    expect(result.created).toBe(false);
    expect(updateBookmark).toHaveBeenCalledWith(
      "http://localhost:3777",
      5,
      expect.objectContaining({
        notes: "Neu",
        tags: ["nuxt", "docs"],
      }),
    );
  });

  it("throws duplicate when bookmark exists without changes", async () => {
    vi.mocked(findBookmarkByUrl).mockResolvedValue(existing);

    await expect(
      saveOrUpdateBookmark("https://example.com", {
        tags: "nuxt",
        notes: "Alt",
      }),
    ).rejects.toMatchObject({ kind: "duplicate" } satisfies Partial<OpenBookmarkApiError>);
  });

  it("adds existing bookmark to list when only listId is set", async () => {
    vi.mocked(findBookmarkByUrl).mockResolvedValue(existing);

    const result = await saveOrUpdateBookmark("https://example.com", {
      tags: "nuxt",
      notes: "Alt",
      listId: 2,
    });

    expect(result.addedToList).toBe(true);
    expect(addBookmarksToList).toHaveBeenCalledWith(
      "http://localhost:3777",
      2,
      [5],
    );
    expect(updateBookmark).not.toHaveBeenCalled();
  });
});
