import { describe, expect, it } from "vitest";
import { TagRepository } from "../../server/repositories/tagRepository";
import { BookmarkRepository } from "../../server/repositories/bookmarkRepository";
import { createMemoryDatabase } from "../../server/utils/createMemoryDatabase";
import { BookmarkDomainError } from "../../shared/errors/bookmarkErrors";

describe("TagRepository CRUD", () => {
  it("creates, updates, and deletes tags", () => {
    const db = createMemoryDatabase();
    const tagRepo = new TagRepository(db);

    const created = tagRepo.create("  Docs  ");
    expect(created).toEqual({ id: created.id, name: "docs" });

    const withCount = tagRepo.getWithCount(created.id);
    expect(withCount).toEqual({ id: created.id, name: "docs", count: 0 });

    const updated = tagRepo.update(created.id, "Documentation");
    expect(updated.name).toBe("documentation");

    expect(tagRepo.delete(created.id)).toBe(true);
    expect(tagRepo.findById(created.id)).toBeNull();
  });

  it("rejects duplicate tag names", () => {
    const db = createMemoryDatabase();
    const tagRepo = new TagRepository(db);

    tagRepo.create("Nuxt");

    expect(() => tagRepo.create("nuxt")).toThrow(
      expect.objectContaining({ code: "DUPLICATE_TAG_NAME" } satisfies Partial<BookmarkDomainError>),
    );
  });

  it("removes bookmark associations when tag is deleted", () => {
    const db = createMemoryDatabase();
    const tagRepo = new TagRepository(db);
    const bookmarkRepo = new BookmarkRepository(db);

    const bookmarkId = bookmarkRepo.insert({
      url: "https://example.com",
      normalized_url: "https://example.com",
      title: "T",
      description: null,
      image_url: null,
      site_name: null,
      notes: null,
    });

    tagRepo.setBookmarkTags(bookmarkId, ["alpha"]);
    const tag = tagRepo.listWithCounts()[0]!;

    tagRepo.delete(tag.id);

    expect(tagRepo.getTagsForBookmark(bookmarkId)).toEqual([]);
  });
});
