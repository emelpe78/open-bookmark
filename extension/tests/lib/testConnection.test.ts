import { beforeEach, describe, expect, it, vi } from "vitest";
import { listTags } from "../../src/lib/openBookmarkApi";
import { testConnection } from "../../src/lib/testConnection";

vi.mock("../../src/lib/openBookmarkApi", () => ({
  listTags: vi.fn(),
}));

describe("testConnection", () => {
  beforeEach(() => {
    vi.mocked(listTags).mockReset();
  });

  it("reports success with tag count", async () => {
    vi.mocked(listTags).mockResolvedValue([
      { id: 1, name: "nuxt", count: 1 },
      { id: 2, name: "docs", count: 2 },
    ]);

    const result = await testConnection("http://localhost:3777");

    expect(result.ok).toBe(true);
    expect(result.message).toContain("2 Tags");
  });

  it("reports failure on network error", async () => {
    const { OpenBookmarkApiError } = await import("../../src/lib/types");
    vi.mocked(listTags).mockRejectedValue(
      new OpenBookmarkApiError(
        "network",
        "Open Bookmark ist unter der konfigurierten URL nicht erreichbar.",
      ),
    );

    const result = await testConnection("http://localhost:3777");

    expect(result.ok).toBe(false);
    expect(result.message).toContain("nicht erreichbar");
  });
});
