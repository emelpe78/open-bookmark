import type Database from "better-sqlite3";
import { BookmarkDomainError } from "#shared/errors/bookmarkErrors";
import { normalizeTagName } from "../../../packages/tag-utils/src/normalizeTagName";
import { parseTagInput } from "../../../packages/tag-utils/src/parseTagInput";

export interface TagRow {
  id: number;
  name: string;
}

export class TagRepository {
  constructor(private readonly db: Database.Database) {}

  listWithCounts(): Array<{ id: number; name: string; count: number }> {
    return this.db
      .prepare(
        `
        SELECT t.id, t.name, COUNT(bt.bookmark_id) AS count
        FROM tags t
        LEFT JOIN bookmark_tags bt ON bt.tag_id = t.id
        GROUP BY t.id, t.name
        ORDER BY t.name COLLATE NOCASE ASC
      `,
      )
      .all() as Array<{ id: number; name: string; count: number }>;
  }

  getTagsForBookmark(bookmarkId: number): string[] {
    const rows = this.db
      .prepare(
        `
        SELECT t.name
        FROM tags t
        INNER JOIN bookmark_tags bt ON bt.tag_id = t.id
        WHERE bt.bookmark_id = ?
        ORDER BY t.name COLLATE NOCASE ASC
      `,
      )
      .all(bookmarkId) as Array<{ name: string }>;

    return rows.map((row) => row.name);
  }

  getTagsForBookmarks(bookmarkIds: number[]): Map<number, string[]> {
    const result = new Map<number, string[]>();
    if (bookmarkIds.length === 0) {
      return result;
    }

    const placeholders = bookmarkIds.map(() => "?").join(", ");
    const rows = this.db
      .prepare(
        `
        SELECT bt.bookmark_id, t.name
        FROM bookmark_tags bt
        INNER JOIN tags t ON t.id = bt.tag_id
        WHERE bt.bookmark_id IN (${placeholders})
        ORDER BY t.name COLLATE NOCASE ASC
      `,
      )
      .all(...bookmarkIds) as Array<{ bookmark_id: number; name: string }>;

    for (const id of bookmarkIds) {
      result.set(id, []);
    }

    for (const row of rows) {
      const tags = result.get(row.bookmark_id) ?? [];
      tags.push(row.name);
      result.set(row.bookmark_id, tags);
    }

    return result;
  }

  setBookmarkTags(bookmarkId: number, tagNames: string[]): void {
    const uniqueNames = [...new Set(parseTagInput(tagNames))];

    const deleteStmt = this.db.prepare(
      "DELETE FROM bookmark_tags WHERE bookmark_id = ?",
    );
    const insertStmt = this.db.prepare(
      "INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)",
    );

    const transaction = this.db.transaction(() => {
      deleteStmt.run(bookmarkId);
      for (const name of uniqueNames) {
        const tag = this.findOrCreateTag(name);
        insertStmt.run(bookmarkId, tag.id);
      }
    });

    transaction();
  }

  findById(id: number): TagRow | null {
    const row = this.db
      .prepare("SELECT id, name FROM tags WHERE id = ?")
      .get(id) as TagRow | undefined;
    return row ?? null;
  }

  getWithCount(id: number): { id: number; name: string; count: number } | null {
    const row = this.db
      .prepare(
        `
        SELECT t.id, t.name, COUNT(bt.bookmark_id) AS count
        FROM tags t
        LEFT JOIN bookmark_tags bt ON bt.tag_id = t.id
        WHERE t.id = ?
        GROUP BY t.id, t.name
      `,
      )
      .get(id) as { id: number; name: string; count: number } | undefined;
    return row ?? null;
  }

  create(name: string): TagRow {
    const normalized = normalizeTagName(name);
    if (!normalized) {
      throw new BookmarkDomainError("EMPTY_TAG_NAME");
    }

    const existing = this.db
      .prepare("SELECT id, name FROM tags WHERE name = ? COLLATE NOCASE")
      .get(normalized) as TagRow | undefined;

    if (existing) {
      throw new BookmarkDomainError("DUPLICATE_TAG_NAME");
    }

    const insert = this.db.prepare("INSERT INTO tags (name) VALUES (?)").run(normalized);
    return { id: Number(insert.lastInsertRowid), name: normalized };
  }

  update(id: number, name: string): TagRow {
    const normalized = normalizeTagName(name);
    if (!normalized) {
      throw new BookmarkDomainError("EMPTY_TAG_NAME");
    }

    const existing = this.findById(id);
    if (!existing) {
      throw new BookmarkDomainError("TAG_NOT_FOUND");
    }

    const duplicate = this.db
      .prepare("SELECT id FROM tags WHERE name = ? COLLATE NOCASE AND id != ?")
      .get(normalized, id) as { id: number } | undefined;

    if (duplicate) {
      throw new BookmarkDomainError("DUPLICATE_TAG_NAME");
    }

    this.db.prepare("UPDATE tags SET name = ? WHERE id = ?").run(normalized, id);
    return { id, name: normalized };
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM tags WHERE id = ?").run(id);
    return result.changes > 0;
  }

  findOrCreateTag(name: string): TagRow {
    const normalized = normalizeTagName(name);
    if (!normalized) {
      throw new BookmarkDomainError("EMPTY_TAG_NAME");
    }

    const existing = this.db
      .prepare("SELECT id, name FROM tags WHERE name = ? COLLATE NOCASE")
      .get(normalized) as TagRow | undefined;

    if (existing) {
      return existing;
    }

    const insert = this.db.prepare("INSERT INTO tags (name) VALUES (?)").run(normalized);
    return { id: Number(insert.lastInsertRowid), name: normalized };
  }
}
