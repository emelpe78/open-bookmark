import type Database from "better-sqlite3";
import { BookmarkDomainError } from "#shared/errors/bookmarkErrors";
import { parseTagInput } from "#shared/lib/parseTagInput";

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

  findOrCreateTag(name: string): TagRow {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BookmarkDomainError("EMPTY_TAG_NAME");
    }

    const existing = this.db
      .prepare("SELECT id, name FROM tags WHERE name = ? COLLATE NOCASE")
      .get(trimmed) as TagRow | undefined;

    if (existing) {
      return existing;
    }

    const insert = this.db.prepare("INSERT INTO tags (name) VALUES (?)").run(trimmed);
    return { id: Number(insert.lastInsertRowid), name: trimmed };
  }
}
