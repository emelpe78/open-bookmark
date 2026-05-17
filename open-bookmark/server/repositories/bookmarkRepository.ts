import type Database from "better-sqlite3";
import type { Bookmark } from "../../shared/types/bookmark";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../shared/constants/pagination";

export interface BookmarkRow {
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

export interface InsertBookmarkData {
  url: string;
  normalized_url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  notes: string | null;
}

export interface UpdateBookmarkMetadataFields {
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
}

export class BookmarkRepository {
  constructor(private readonly db: Database.Database) {}

  existsByNormalizedUrl(normalizedUrl: string): boolean {
    const row = this.db
      .prepare("SELECT id FROM bookmarks WHERE normalized_url = ?")
      .get(normalizedUrl);
    return Boolean(row);
  }

  findById(id: number, tagsByBookmarkId: Map<number, string[]>): Bookmark | null {
    const row = this.db
      .prepare("SELECT * FROM bookmarks WHERE id = ?")
      .get(id) as BookmarkRow | undefined;

    if (!row) {
      return null;
    }

    return this.mapRow(row, tagsByBookmarkId.get(row.id) ?? []);
  }

  list(
    options: ListBookmarksOptions,
    tagsByBookmarkId: Map<number, string[]>,
  ): {
    items: Bookmark[];
    total: number;
    page: number;
    pageSize: number;
  } {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE),
    );
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

    const totalRow = this.db
      .prepare(`SELECT COUNT(*) AS count FROM bookmarks b ${whereClause}`)
      .get(...params) as { count: number };

    const rows = this.db
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
      items: rows.map((row) => this.mapRow(row, tagsByBookmarkId.get(row.id) ?? [])),
      total: totalRow.count,
      page,
      pageSize,
    };
  }

  insert(data: InsertBookmarkData): number {
    const result = this.db
      .prepare(
        `
        INSERT INTO bookmarks (
          url, normalized_url, title, description, image_url, site_name, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        data.url,
        data.normalized_url,
        data.title,
        data.description,
        data.image_url,
        data.site_name,
        data.notes,
      );

    return Number(result.lastInsertRowid);
  }

  updateWithMetadata(
    id: number,
    data: InsertBookmarkData,
  ): void {
    this.db
      .prepare(
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
      )
      .run(
        data.url,
        data.normalized_url,
        data.title,
        data.description,
        data.image_url,
        data.site_name,
        data.notes,
        id,
      );
  }

  updateNotes(id: number, notes: string | null): void {
    this.db
      .prepare(
        `
        UPDATE bookmarks SET
          notes = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `,
      )
      .run(notes, id);
  }

  updateMetadataFields(id: number, metadata: UpdateBookmarkMetadataFields): void {
    this.db
      .prepare(
        `
        UPDATE bookmarks SET
          title = ?,
          description = ?,
          image_url = ?,
          site_name = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `,
      )
      .run(
        metadata.title,
        metadata.description,
        metadata.image_url,
        metadata.site_name,
        id,
      );
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM bookmarks WHERE id = ?").run(id);
    return result.changes > 0;
  }

  private mapRow(row: BookmarkRow, tags: string[]): Bookmark {
    return { ...row, tags };
  }
}
