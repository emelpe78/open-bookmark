import type Database from "better-sqlite3";
import { BookmarkDomainError } from "#shared/errors/bookmarkErrors";
import { normalizeListName } from "#shared/lib/normalizeListName";
import type {
  BookmarkListDetail,
  BookmarkListEntry,
  BookmarkListSummary,
} from "#shared/types/list";

export interface ListRow {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export class ListRepository {
  constructor(private readonly db: Database.Database) {}

  listWithCounts(): BookmarkListSummary[] {
    return this.db
      .prepare(
        `
        SELECT l.id, l.name, l.created_at, l.updated_at,
               COUNT(lb.bookmark_id) AS count
        FROM lists l
        LEFT JOIN list_bookmarks lb ON lb.list_id = l.id
        GROUP BY l.id, l.name, l.created_at, l.updated_at
        ORDER BY l.name COLLATE NOCASE ASC
      `,
      )
      .all() as BookmarkListSummary[];
  }

  findById(id: number): ListRow | null {
    const row = this.db
      .prepare(
        "SELECT id, name, created_at, updated_at FROM lists WHERE id = ?",
      )
      .get(id) as ListRow | undefined;
    return row ?? null;
  }

  getDetail(id: number): BookmarkListDetail | null {
    const list = this.findById(id);
    if (!list) {
      return null;
    }

    const bookmarks = this.db
      .prepare(
        `
        SELECT b.id, b.url, b.title, b.site_name
        FROM list_bookmarks lb
        INNER JOIN bookmarks b ON b.id = lb.bookmark_id
        WHERE lb.list_id = ?
        ORDER BY lb.position ASC, b.title COLLATE NOCASE ASC
      `,
      )
      .all(id) as BookmarkListEntry[];

    return {
      id: list.id,
      name: list.name,
      created_at: list.created_at,
      updated_at: list.updated_at,
      bookmarks,
    };
  }

  create(name: string, bookmarkIds: number[]): ListRow {
    const normalized = normalizeListName(name);
    if (!normalized) {
      throw new BookmarkDomainError("EMPTY_LIST_NAME");
    }

    const duplicate = this.db
      .prepare("SELECT id FROM lists WHERE name = ? COLLATE NOCASE")
      .get(normalized) as { id: number } | undefined;

    if (duplicate) {
      throw new BookmarkDomainError("DUPLICATE_LIST_NAME");
    }

    const insertList = this.db.prepare(
      "INSERT INTO lists (name) VALUES (?)",
    );
    const insertLink = this.db.prepare(
      "INSERT OR IGNORE INTO list_bookmarks (list_id, bookmark_id, position) VALUES (?, ?, ?)",
    );
    const existsBookmark = this.db.prepare(
      "SELECT id FROM bookmarks WHERE id = ?",
    );

    const transaction = this.db.transaction(() => {
      const result = insertList.run(normalized);
      const listId = Number(result.lastInsertRowid);
      let position = 0;

      for (const bookmarkId of bookmarkIds) {
        const bookmark = existsBookmark.get(bookmarkId) as
          | { id: number }
          | undefined;
        if (!bookmark) {
          continue;
        }
        insertLink.run(listId, bookmarkId, position);
        position += 1;
      }

      this.touchUpdatedAt(listId);
      this.touchBookmarksUpdatedAt(bookmarkIds);
      return listId;
    });

    const listId = transaction();
    return this.findById(listId)!;
  }

  setBookmarks(listId: number, bookmarkIds: number[]): ListRow {
    const list = this.findById(listId);
    if (!list) {
      throw new BookmarkDomainError("LIST_NOT_FOUND");
    }

    const uniqueIds = [...new Set(bookmarkIds)];
    const existsBookmark = this.db.prepare(
      "SELECT id FROM bookmarks WHERE id = ?",
    );
    const validIds: number[] = [];
    for (const bookmarkId of uniqueIds) {
      const bookmark = existsBookmark.get(bookmarkId) as
        | { id: number }
        | undefined;
      if (bookmark) {
        validIds.push(bookmarkId);
      }
    }

    const previousRows = this.db
      .prepare("SELECT bookmark_id FROM list_bookmarks WHERE list_id = ?")
      .all(listId) as Array<{ bookmark_id: number }>;
    const previousIds = previousRows.map((row) => row.bookmark_id);

    const deleteLinks = this.db.prepare(
      "DELETE FROM list_bookmarks WHERE list_id = ?",
    );
    const insertLink = this.db.prepare(
      "INSERT INTO list_bookmarks (list_id, bookmark_id, position) VALUES (?, ?, ?)",
    );

    const transaction = this.db.transaction(() => {
      deleteLinks.run(listId);
      let position = 0;
      for (const bookmarkId of validIds) {
        insertLink.run(listId, bookmarkId, position);
        position += 1;
      }
      this.touchUpdatedAt(listId);
      this.touchBookmarksUpdatedAt([
        ...new Set([...previousIds, ...validIds]),
      ]);
    });

    transaction();
    return this.findById(listId)!;
  }

  addBookmarks(listId: number, bookmarkIds: number[]): ListRow {
    const list = this.findById(listId);
    if (!list) {
      throw new BookmarkDomainError("LIST_NOT_FOUND");
    }

    const maxPosition = this.db
      .prepare(
        "SELECT COALESCE(MAX(position), -1) AS max_pos FROM list_bookmarks WHERE list_id = ?",
      )
      .get(listId) as { max_pos: number };

    let position = maxPosition.max_pos + 1;
    const insertLink = this.db.prepare(
      "INSERT OR IGNORE INTO list_bookmarks (list_id, bookmark_id, position) VALUES (?, ?, ?)",
    );
    const existsBookmark = this.db.prepare(
      "SELECT id FROM bookmarks WHERE id = ?",
    );

    const transaction = this.db.transaction(() => {
      for (const bookmarkId of bookmarkIds) {
        const bookmark = existsBookmark.get(bookmarkId) as
          | { id: number }
          | undefined;
        if (!bookmark) {
          continue;
        }
        const inserted = insertLink.run(listId, bookmarkId, position);
        if (inserted.changes > 0) {
          position += 1;
        }
      }
      this.touchUpdatedAt(listId);
      this.touchBookmarksUpdatedAt(bookmarkIds);
    });

    transaction();
    return this.findById(listId)!;
  }

  updateName(id: number, name: string): ListRow {
    const normalized = normalizeListName(name);
    if (!normalized) {
      throw new BookmarkDomainError("EMPTY_LIST_NAME");
    }

    const existing = this.findById(id);
    if (!existing) {
      throw new BookmarkDomainError("LIST_NOT_FOUND");
    }

    const duplicate = this.db
      .prepare(
        "SELECT id FROM lists WHERE name = ? COLLATE NOCASE AND id != ?",
      )
      .get(normalized, id) as { id: number } | undefined;

    if (duplicate) {
      throw new BookmarkDomainError("DUPLICATE_LIST_NAME");
    }

    this.db
      .prepare("UPDATE lists SET name = ?, updated_at = datetime('now') WHERE id = ?")
      .run(normalized, id);

    return this.findById(id)!;
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM lists WHERE id = ?").run(id);
    return result.changes > 0;
  }

  getListNamesForBookmarks(bookmarkIds: number[]): Map<number, string[]> {
    const result = new Map<number, string[]>();
    if (bookmarkIds.length === 0) {
      return result;
    }

    const placeholders = bookmarkIds.map(() => "?").join(", ");
    const rows = this.db
      .prepare(
        `
        SELECT lb.bookmark_id, l.name
        FROM list_bookmarks lb
        INNER JOIN lists l ON l.id = lb.list_id
        WHERE lb.bookmark_id IN (${placeholders})
        ORDER BY l.name COLLATE NOCASE ASC
      `,
      )
      .all(...bookmarkIds) as Array<{ bookmark_id: number; name: string }>;

    for (const id of bookmarkIds) {
      result.set(id, []);
    }

    for (const row of rows) {
      const names = result.get(row.bookmark_id) ?? [];
      names.push(row.name);
      result.set(row.bookmark_id, names);
    }

    return result;
  }

  getWithCount(id: number): BookmarkListSummary | null {
    const row = this.db
      .prepare(
        `
        SELECT l.id, l.name, l.created_at, l.updated_at,
               COUNT(lb.bookmark_id) AS count
        FROM lists l
        LEFT JOIN list_bookmarks lb ON lb.list_id = l.id
        WHERE l.id = ?
        GROUP BY l.id, l.name, l.created_at, l.updated_at
      `,
      )
      .get(id) as BookmarkListSummary | undefined;
    return row ?? null;
  }

  private touchUpdatedAt(listId: number): void {
    this.db
      .prepare("UPDATE lists SET updated_at = datetime('now') WHERE id = ?")
      .run(listId);
  }

  private touchBookmarksUpdatedAt(bookmarkIds: number[]): void {
    if (bookmarkIds.length === 0) {
      return;
    }

    const placeholders = bookmarkIds.map(() => "?").join(", ");
    this.db
      .prepare(
        `UPDATE bookmarks SET updated_at = datetime('now') WHERE id IN (${placeholders})`,
      )
      .run(...bookmarkIds);
  }
}
