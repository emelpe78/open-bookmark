/**
 * CLI: SQL-Import mit derselben Node-Runtime wie der Nitro-Child (nicht Electron).
 * Usage: DATABASE_PATH=/path/to/bookmarks.db node scripts/import-database.mjs /path/to/dump.sql
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_SQL_IMPORT_BYTES = 50 * 1024 * 1024;
const runtimeRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(join(runtimeRoot, "package.json"));
const Database = require("better-sqlite3");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function validateSqlImport(content) {
  const trimmed = content.trim();
  if (!trimmed) {
    fail("Die SQL-Datei ist leer.");
  }

  if (Buffer.byteLength(trimmed, "utf8") > MAX_SQL_IMPORT_BYTES) {
    fail("Die SQL-Datei ist zu groß (max. 50 MB).");
  }

  const normalized = trimmed.toUpperCase();
  if (!normalized.includes("CREATE TABLE") && !normalized.includes("INSERT INTO")) {
    fail(
      "Die Datei enthält kein gültiges Open-Bookmark-Backup (CREATE TABLE oder INSERT INTO erwartet).",
    );
  }

  const forbidden = ["ATTACH ", "DETACH ", "PRAGMA database_list"];
  for (const pattern of forbidden) {
    if (normalized.includes(pattern)) {
      fail("Die SQL-Datei enthält nicht erlaubte Befehle.");
    }
  }
}

function removeDatabaseFiles(databasePath) {
  for (const suffix of ["", "-wal", "-shm"]) {
    const filePath = suffix ? `${databasePath}${suffix}` : databasePath;
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}

function initEmptySchema(databasePath) {
  const database = new Database(databasePath);
  try {
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
    `);
  } finally {
    database.close();
  }
}

function resolveDatabasePath() {
  const configured = process.env.DATABASE_PATH;
  if (!configured) {
    fail("DATABASE_PATH fehlt.");
  }
  return isAbsolute(configured) ? configured : resolve(runtimeRoot, configured);
}

const sqlPath = process.argv[2];
if (!sqlPath) {
  fail("Aufruf: node scripts/import-database.mjs <pfad-zur.sql-datei>");
}

const sql = readFileSync(sqlPath, "utf8");
validateSqlImport(sql);

const databasePath = resolveDatabasePath();
mkdirSync(dirname(databasePath), { recursive: true });
removeDatabaseFiles(databasePath);

const database = new Database(databasePath);
try {
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = OFF");
  database.exec(sql);
  database.pragma("foreign_keys = ON");
  database.pragma("wal_checkpoint(TRUNCATE)");
} catch (error) {
  database.close();
  removeDatabaseFiles(databasePath);
  initEmptySchema(databasePath);
  fail(error instanceof Error ? error.message : "SQL-Import fehlgeschlagen.");
}

database.close();
