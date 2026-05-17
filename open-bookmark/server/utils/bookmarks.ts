import type { Bookmark, PageMetadata } from "../../shared/types/bookmark";
import { getDb } from "./db";
import { fallbackMetadata, fetchPageMetadata } from "./metadata";
import { normalizeNotesInput } from "../../lib/markdown";
import { normalizeUrl, UrlValidationError } from "./normalizeUrl";
import { getTagsForBookmark, parseTagInput, setBookmarkTags } from "./tags";

interface BookmarkRow {
  id: number;
  url: string;
  normalized_url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListBookmarksOptions {
  search?: string;
  page?: number;
  pageSize?: number;
  tag?: string;
}

function mapRowToBookmark(row: BookmarkRow): Bookmark {
  return {
    ...row,
    tags: getTagsForBookmark(row.id),
  };
}

export function bookmarkExistsByNormalizedUrl(normalizedUrl: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT id FROM bookmarks WHERE normalized_url = ?")
    .get(normalizedUrl);
  return Boolean(row);
}

export function getBookmarkById(id: number): Bookmark | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM bookmarks WHERE id = ?")
    .get(id) as BookmarkRow | undefined;

  if (!row) {
    return null;
  }

  return mapRowToBookmark(row);
}

export function listBookmarks(options: ListBookmarksOptions = {}): {
  items: Bookmark[];
  total: number;
  page: number;
  pageSize: number;
} {
  const db = getDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 10));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (options.search?.trim()) {
    const term = `%${options.search.trim()}%`;
    conditions.push(
      `(b.url LIKE ? OR b.title LIKE ? OR b.description LIKE ? OR b.notes LIKE ? OR EXISTS (
        SELECT 1 FROM bookmark_tags bt
        INNER JOIN tags t ON t.id = bt.tag_id
        WHERE bt.bookmark_id = b.id AND t.name LIKE ?
      ))`,
    );
    params.push(term, term, term, term, term);
  }

  if (options.tag?.trim()) {
    conditions.push(`EXISTS (
      SELECT 1 FROM bookmark_tags bt
      INNER JOIN tags t ON t.id = bt.tag_id
      WHERE bt.bookmark_id = b.id AND t.name = ? COLLATE NOCASE
    )`);
    params.push(options.tag.trim());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS count FROM bookmarks b ${whereClause}`)
    .get(...params) as { count: number };

  const rows = db
    .prepare(
      `
      SELECT b.*
      FROM bookmarks b
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `,
    )
    .all(...params, pageSize, offset) as BookmarkRow[];

  return {
    items: rows.map(mapRowToBookmark),
    total: totalRow.count,
    page,
    pageSize,
  };
}

async function resolveMetadata(url: string): Promise<PageMetadata> {
  try {
    return await fetchPageMetadata(url);
  } catch {
    return fallbackMetadata(url);
  }
}

export async function createBookmark(input: {
  url: string;
  notes?: string | null;
  tags?: string[] | string;
}): Promise<Bookmark> {
  const { url, normalized_url } = normalizeUrl(input.url);

  if (bookmarkExistsByNormalizedUrl(normalized_url)) {
    throw createError({
      statusCode: 409,
      statusMessage: "Bookmark existiert bereits.",
    });
  }

  const metadata = await resolveMetadata(url);
  const notes = normalizeNotesInput(input.notes);
  const db = getDb();

  const result = db
    .prepare(
      `
      INSERT INTO bookmarks (
        url, normalized_url, title, description, image_url, site_name, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      url,
      normalized_url,
      metadata.title,
      metadata.description,
      metadata.image_url,
      metadata.site_name,
      notes,
    );

  const id = Number(result.lastInsertRowid);
  const tagNames = parseTagInput(input.tags);
  if (tagNames.length > 0) {
    setBookmarkTags(id, tagNames);
  }

  const bookmark = getBookmarkById(id);
  if (!bookmark) {
    throw createError({ statusCode: 500, statusMessage: "Bookmark konnte nicht geladen werden." });
  }

  return bookmark;
}

export async function createBookmarkFromUrl(
  rawUrl: string,
): Promise<"created" | "skipped" | { failed: string }> {
  try {
    const { normalized_url } = normalizeUrl(rawUrl);

    if (bookmarkExistsByNormalizedUrl(normalized_url)) {
      return "skipped";
    }

    await createBookmark({ url: rawUrl });
    return "created";
  } catch (error) {
    if (error instanceof UrlValidationError) {
      return { failed: error.message };
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      (error as { statusCode: number }).statusCode === 409
    ) {
      return "skipped";
    }

    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    return { failed: message };
  }
}

export async function updateBookmark(
  id: number,
  input: {
    url?: string;
    notes?: string | null;
    tags?: string[] | string;
  },
): Promise<Bookmark> {
  const existing = getBookmarkById(id);
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Bookmark nicht gefunden." });
  }

  let url = existing.url;
  let normalized_url = existing.normalized_url;
  let metadata: PageMetadata | null = null;

  if (input.url !== undefined) {
    const normalized = normalizeUrl(input.url);
    if (
      normalized.normalized_url !== existing.normalized_url &&
      bookmarkExistsByNormalizedUrl(normalized.normalized_url)
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: "Ein Bookmark mit dieser URL existiert bereits.",
      });
    }
    url = normalized.url;
    normalized_url = normalized.normalized_url;
    metadata = await resolveMetadata(url);
  }

  const notes =
    input.notes !== undefined ? normalizeNotesInput(input.notes) : existing.notes;

  const db = getDb();

  if (metadata) {
    db.prepare(
      `
      UPDATE bookmarks SET
        url = ?,
        normalized_url = ?,
        title = ?,
        description = ?,
        image_url = ?,
        site_name = ?,
        notes = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `,
    ).run(
      url,
      normalized_url,
      metadata.title,
      metadata.description,
      metadata.image_url,
      metadata.site_name,
      notes,
      id,
    );
  } else {
    db.prepare(
      `
      UPDATE bookmarks SET
        notes = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `,
    ).run(notes, id);
  }

  if (input.tags !== undefined) {
    setBookmarkTags(id, parseTagInput(input.tags));
  }

  const updated = getBookmarkById(id);
  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: "Bookmark konnte nicht geladen werden." });
  }

  return updated;
}

export async function refreshBookmarkMetadata(id: number): Promise<Bookmark> {
  const existing = getBookmarkById(id);
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Bookmark nicht gefunden." });
  }

  const metadata = await resolveMetadata(existing.url);
  const db = getDb();

  db.prepare(
    `
    UPDATE bookmarks SET
      title = ?,
      description = ?,
      image_url = ?,
      site_name = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `,
  ).run(
    metadata.title,
    metadata.description,
    metadata.image_url,
    metadata.site_name,
    id,
  );

  const updated = getBookmarkById(id);
  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: "Bookmark konnte nicht geladen werden." });
  }

  return updated;
}

export function deleteBookmark(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM bookmarks WHERE id = ?").run(id);
  return result.changes > 0;
}
