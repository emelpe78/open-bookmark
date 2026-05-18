import { describe, expect, it, vi } from "vitest";
import {
  createBookmark,
  DEFAULT_REQUEST_TIMEOUT_MS,
} from "../../src/lib/openBookmarkApi";
import { OpenBookmarkApiError } from "../../src/lib/types";

const sampleBookmark = {
  id: 1,
  url: "https://example.com",
  normalized_url: "https://example.com/",
  title: "Example",
  description: null,
  image_url: null,
  site_name: null,
  notes: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  tags: [],
};

describe("createBookmark", () => {
  it("POSTs url to /api/bookmarks and returns bookmark on 201", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ bookmark: sampleBookmark }),
    });

    const result = await createBookmark(
      "http://localhost:3777",
      { url: "https://example.com" },
      { fetch: fetchMock },
    );

    expect(result).toEqual(sampleBookmark);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3777/api/bookmarks",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://example.com" }),
      }),
    );
  });

  it("includes notes in body when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ bookmark: sampleBookmark }),
    });

    await createBookmark(
      "http://localhost:3777",
      { url: "https://example.com", notes: "Kurznotiz" },
      { fetch: fetchMock },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          url: "https://example.com",
          notes: "Kurznotiz",
        }),
      }),
    );
  });

  it("includes tags array in body when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        bookmark: { ...sampleBookmark, tags: ["nuxt", "docs"] },
      }),
    });

    await createBookmark(
      "http://localhost:3777",
      { url: "https://example.com", tags: "nuxt, docs" },
      { fetch: fetchMock },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          url: "https://example.com",
          tags: ["nuxt", "docs"],
        }),
      }),
    );
  });

  it("omits tags when empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ bookmark: sampleBookmark }),
    });

    await createBookmark(
      "http://localhost:3777",
      { url: "https://example.com", tags: "  , " },
      { fetch: fetchMock },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ url: "https://example.com" }),
      }),
    );
  });

  it("omits notes when empty or whitespace only", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ bookmark: sampleBookmark }),
    });

    await createBookmark(
      "http://localhost:3777",
      { url: "https://example.com", notes: "   " },
      { fetch: fetchMock },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ url: "https://example.com" }),
      }),
    );
  });

  it("throws duplicate error on 409", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: "Conflict",
      json: async () => ({ statusMessage: "Bookmark existiert bereits." }),
    });

    await expect(
      createBookmark(
        "http://localhost:3777",
        { url: "https://example.com" },
        { fetch: fetchMock },
      ),
    ).rejects.toMatchObject({
      kind: "duplicate",
    } satisfies Partial<OpenBookmarkApiError>);
  });

  it("throws network error when fetch fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      createBookmark(
        "http://localhost:3777",
        { url: "https://example.com" },
        { fetch: fetchMock },
      ),
    ).rejects.toMatchObject({ kind: "network" });
  });

  it("uses configured timeout", async () => {
    const fetchMock = vi.fn().mockImplementation((_url, init) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({ bookmark: sampleBookmark }),
      });
    });

    await createBookmark(
      "http://localhost:3777",
      { url: "https://example.com" },
      { fetch: fetchMock, timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS },
    );
  });
});
