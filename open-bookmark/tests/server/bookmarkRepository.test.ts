import { describe, expect, it } from "vitest";
import { BookmarkRepository } from "../../server/repositories/bookmarkRepository";
import { TagRepository } from "../../server/repositories/tagRepository";
import { createMemoryDatabase } from "../../server/utils/createMemoryDatabase";

describe("BookmarkRepository with tags", () => {
  it("loads tags in batch for listed bookmarks", () => {
    const db = createMemoryDatabase();
    const bookmarkRepo = new BookmarkRepository(db);
    const tagRepo = new TagRepository(db);

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

    tagRepo.setBookmarkTags(id1, ["alpha", "beta"]);
    tagRepo.setBookmarkTags(id2, ["gamma"]);

    const preliminary = bookmarkRepo.list({}, new Map());
    const tagsByBookmarkId = tagRepo.getTagsForBookmarks(
      preliminary.items.map((item) => item.id),
    );

    const items = preliminary.items.map((item) => ({
      ...item,
      tags: tagsByBookmarkId.get(item.id) ?? [],
    }));

    const byId = Object.fromEntries(items.map((item) => [item.id, item.tags]));

    expect(byId[id1]).toEqual(["alpha", "beta"]);
    expect(byId[id2]).toEqual(["gamma"]);
  });
});
