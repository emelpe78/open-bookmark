import { describe, expect, it, vi } from "vitest";
import { BookmarkService } from "../../server/domain/bookmarkService";
import { BookmarkRepository } from "../../server/repositories/bookmarkRepository";
import { TagRepository } from "../../server/repositories/tagRepository";
import { createMemoryDatabase } from "../../server/utils/createMemoryDatabase";
import { BookmarkDomainError } from "../../shared/errors/bookmarkErrors";

describe("BookmarkService", () => {
  it("createFromUrl returns failed for invalid URL", async () => {
    const db = createMemoryDatabase();
    const service = new BookmarkService({
      bookmarkRepo: new BookmarkRepository(db),
      tagRepo: new TagRepository(db),
      resolveMetadata: vi.fn().mockResolvedValue({
        title: "T",
        description: null,
        image_url: null,
        site_name: "example.com",
      }),
    });

    const result = await service.createFromUrl("javascript:alert(1)");
    expect(result).toEqual({ failed: "Ungültige URL." });
  });

  it("create throws DUPLICATE_URL for duplicate normalized URL", async () => {
    const db = createMemoryDatabase();
    const resolveMetadata = vi.fn().mockResolvedValue({
      title: "T",
      description: null,
      image_url: null,
      site_name: "example.com",
    });

    const service = new BookmarkService({
      bookmarkRepo: new BookmarkRepository(db),
      tagRepo: new TagRepository(db),
      resolveMetadata,
    });

    await service.create({ url: "https://example.com" });

    await expect(service.create({ url: "https://example.com/" })).rejects.toBeInstanceOf(
      BookmarkDomainError,
    );
  });

  it("createFromUrl skips duplicates", async () => {
    const db = createMemoryDatabase();
    const service = new BookmarkService({
      bookmarkRepo: new BookmarkRepository(db),
      tagRepo: new TagRepository(db),
      resolveMetadata: vi.fn().mockResolvedValue({
        title: "T",
        description: null,
        image_url: null,
        site_name: "example.com",
      }),
    });

    await service.create({ url: "https://example.com" });
    const result = await service.createFromUrl("https://example.com/");

    expect(result).toBe("skipped");
  });
});
