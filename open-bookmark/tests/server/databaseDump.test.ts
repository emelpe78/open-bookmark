import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { BookmarkRepository } from "../../server/repositories/bookmarkRepository";
import { TagRepository } from "../../server/repositories/tagRepository";
import { createMemoryDatabase } from "../../server/utils/createMemoryDatabase";
import { dumpDatabaseToSql } from "../../server/utils/databaseDump";
import { getDatabaseInfo } from "../../server/utils/databaseInfo";

describe("databaseDump", () => {
  it("round-trips schema and data into a fresh database", () => {
    const source = createMemoryDatabase();
    const bookmarkRepo = new BookmarkRepository(source);
    const tagRepo = new TagRepository(source);

    const bookmarkId = bookmarkRepo.insert({
      url: "https://example.com",
      normalized_url: "https://example.com",
      title: "Example",
      description: "Desc",
      image_url: null,
      site_name: null,
      notes: "Note with 'quotes'",
    });
    tagRepo.setBookmarkTags(bookmarkId, ["alpha", "beta"]);

    const dump = dumpDatabaseToSql(source);
    const restored = new Database(":memory:");
    restored.exec(dump);

    const restoredBookmarkRepo = new BookmarkRepository(restored);
    const restoredTagRepo = new TagRepository(restored);

    const listed = restoredBookmarkRepo.list({}, new Map());
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]?.title).toBe("Example");
    expect(listed.items[0]?.notes).toBe("Note with 'quotes'");

    const tags = restoredTagRepo.getTagsForBookmarks([bookmarkId]);
    expect(tags.get(bookmarkId)).toEqual(["alpha", "beta"]);

    restored.close();
    source.close();
  });
});

describe("getDatabaseInfo", () => {
  it("returns bookmark count for an open database", () => {
    const db = createMemoryDatabase();
    const bookmarkRepo = new BookmarkRepository(db);
    bookmarkRepo.insert({
      url: "https://a.com",
      normalized_url: "https://a.com",
      title: "A",
      description: null,
      image_url: null,
      site_name: null,
      notes: null,
    });

    const info = getDatabaseInfo(db, ":memory:");
    expect(info.path).toBe(":memory:");
    expect(info.sizeBytes).toBeNull();
    expect(info.bookmarkCount).toBe(1);
    expect(info.isDesktop).toBe(false);

    db.close();
  });
});
