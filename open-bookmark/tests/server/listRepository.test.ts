import { describe, expect, it } from "vitest";
import { ListRepository } from "../../server/repositories/listRepository";
import { BookmarkRepository } from "../../server/repositories/bookmarkRepository";
import { createMemoryDatabase } from "../../server/utils/createMemoryDatabase";
import { BookmarkDomainError } from "../../shared/errors/bookmarkErrors";

describe("ListRepository", () => {
  it("creates a list with bookmarks", () => {
    const db = createMemoryDatabase();
    const listRepo = new ListRepository(db);
    const bookmarkRepo = new BookmarkRepository(db);

    const bookmarkId = bookmarkRepo.insert({
      url: "https://example.com",
      normalized_url: "https://example.com",
      title: "Example",
      description: null,
      image_url: null,
      site_name: null,
      notes: null,
    });

    const list = listRepo.create("  Lesen  ", [bookmarkId]);
    expect(list.name).toBe("Lesen");

    const detail = listRepo.getDetail(list.id);
    expect(detail?.bookmarks).toHaveLength(1);
    expect(detail?.bookmarks[0]?.url).toBe("https://example.com");
  });

  it("rejects duplicate list names", () => {
    const db = createMemoryDatabase();
    const listRepo = new ListRepository(db);

    listRepo.create("Arbeit", []);

    expect(() => listRepo.create("arbeit", [])).toThrow(
      expect.objectContaining({
        code: "DUPLICATE_LIST_NAME",
      } satisfies Partial<BookmarkDomainError>),
    );
  });

  it("returns list names per bookmark", () => {
    const db = createMemoryDatabase();
    const listRepo = new ListRepository(db);
    const bookmarkRepo = new BookmarkRepository(db);

    const bookmarkId = bookmarkRepo.insert({
      url: "https://example.com",
      normalized_url: "https://example.com",
      title: null,
      description: null,
      image_url: null,
      site_name: null,
      notes: null,
    });

    listRepo.create("Lesen", [bookmarkId]);
    listRepo.create("Arbeit", [bookmarkId]);

    const byBookmark = listRepo.getListNamesForBookmarks([bookmarkId]);
    expect(byBookmark.get(bookmarkId)).toEqual(["Arbeit", "Lesen"]);
  });

  it("replaces list membership with setBookmarks", () => {
    const db = createMemoryDatabase();
    const listRepo = new ListRepository(db);
    const bookmarkRepo = new BookmarkRepository(db);

    const id1 = bookmarkRepo.insert({
      url: "https://a.com",
      normalized_url: "https://a.com",
      title: "A",
      description: null,
      image_url: null,
      site_name: null,
      notes: null,
    });
    const id2 = bookmarkRepo.insert({
      url: "https://b.com",
      normalized_url: "https://b.com",
      title: "B",
      description: null,
      image_url: null,
      site_name: null,
      notes: null,
    });

    const list = listRepo.create("Mix", [id1, id2]);
    listRepo.setBookmarks(list.id, [id2]);

    const detail = listRepo.getDetail(list.id);
    expect(detail?.bookmarks.map((entry) => entry.id)).toEqual([id2]);
  });

  it("deletes lists without removing bookmarks", () => {
    const db = createMemoryDatabase();
    const listRepo = new ListRepository(db);
    const bookmarkRepo = new BookmarkRepository(db);

    const bookmarkId = bookmarkRepo.insert({
      url: "https://example.com",
      normalized_url: "https://example.com",
      title: null,
      description: null,
      image_url: null,
      site_name: null,
      notes: null,
    });

    const list = listRepo.create("Temp", [bookmarkId]);
    expect(listRepo.delete(list.id)).toBe(true);
    expect(bookmarkRepo.findById(bookmarkId, new Map())).not.toBeNull();
  });
});
