import Database from "better-sqlite3";
import {
  isDesktopRuntimeEnv,
  WEB_DEV_DATABASE_PATH,
} from "#shared/constants/database";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { runMigrations } from "./schemaMigrations";

let db: Database.Database | null = null;

function resolvePathFromConfigured(configured: string): string {
  return isAbsolute(configured) ? configured : resolve(process.cwd(), configured);
}

function databasePathFromEnv(): string | undefined {
  return process.env.DATABASE_PATH ?? process.env.NUXT_DATABASE_PATH;
}

/**
 * Desktop: only DATABASE_PATH from Electron (Application Support or preferences).
 * Web dev: DATABASE_PATH / .env, else ./data/bookmarks.db — never Application Support.
 */
export function resolveConfiguredDatabasePath(): string {
  if (isDesktopRuntimeEnv()) {
    const configured = databasePathFromEnv();
    if (!configured) {
      throw new Error(
        "Desktop-Laufzeit ohne DATABASE_PATH. Bitte die Desktop-App neu starten.",
      );
    }
    return resolvePathFromConfigured(configured);
  }

  const fromEnv = process.env.DATABASE_PATH;
  if (fromEnv) {
    return resolvePathFromConfigured(fromEnv);
  }

  const config = useRuntimeConfig();
  const configured = config.databasePath || WEB_DEV_DATABASE_PATH;
  return resolvePathFromConfigured(configured);
}

export function isDesktopDatabaseRuntime(): boolean {
  return isDesktopRuntimeEnv();
}

export function getDb(): Database.Database {
  if (db) {
    return db;
  }

  const path = resolveConfiguredDatabasePath();
  mkdirSync(dirname(path), { recursive: true });

  db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initSchema(db);
  runMigrations(db);

  return db;
}

export function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      normalized_url TEXT NOT NULL UNIQUE,
      title TEXT,
      description TEXT,
      image_url TEXT,
      site_name TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE
    );

    CREATE TABLE IF NOT EXISTS bookmark_tags (
      bookmark_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (bookmark_id, tag_id),
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bookmarks_normalized_url ON bookmarks(normalized_url);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS list_bookmarks (
      list_id INTEGER NOT NULL,
      bookmark_id INTEGER NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (list_id, bookmark_id),
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lists_name ON lists(name);
    CREATE INDEX IF NOT EXISTS idx_list_bookmarks_list ON list_bookmarks(list_id, position);
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
