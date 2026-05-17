import { getDb } from "./db";

export interface TagRow {
  id: number;
  name: string;
}

export function listTagsWithCounts(): Array<{ id: number; name: string; count: number }> {
  const db = getDb();
  return db
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

export function findOrCreateTag(name: string): TagRow {
  const db = getDb();
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Tag-Name darf nicht leer sein.");
  }

  const existing = db
    .prepare("SELECT id, name FROM tags WHERE name = ? COLLATE NOCASE")
    .get(trimmed) as TagRow | undefined;

  if (existing) {
    return existing;
  }

  const result = db.prepare("INSERT INTO tags (name) VALUES (?)").run(trimmed);
  return { id: Number(result.lastInsertRowid), name: trimmed };
}

export function getTagsForBookmark(bookmarkId: number): string[] {
  const db = getDb();
  const rows = db
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

export function setBookmarkTags(bookmarkId: number, tagNames: string[]): void {
  const db = getDb();
  const uniqueNames = [
    ...new Set(
      tagNames
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ];

  const deleteStmt = db.prepare("DELETE FROM bookmark_tags WHERE bookmark_id = ?");
  const insertStmt = db.prepare(
    "INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)",
  );

  const transaction = db.transaction(() => {
    deleteStmt.run(bookmarkId);
    for (const name of uniqueNames) {
      const tag = findOrCreateTag(name);
      insertStmt.run(bookmarkId, tag.id);
    }
  });

  transaction();
}

export function parseTagInput(tags: string[] | string | undefined): string[] {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.flatMap((tag) =>
      tag
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    );
  }

  return tags
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
