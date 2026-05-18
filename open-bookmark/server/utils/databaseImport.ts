import Database from "better-sqlite3";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
import { closeDb, initSchema } from "./db";

export const MAX_SQL_IMPORT_BYTES = 50 * 1024 * 1024;

export class DatabaseImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseImportError";
  }
}

export function validateSqlImport(content: string): void {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new DatabaseImportError("Die SQL-Datei ist leer.");
  }

  if (Buffer.byteLength(trimmed, "utf8") > MAX_SQL_IMPORT_BYTES) {
    throw new DatabaseImportError("Die SQL-Datei ist zu groß (max. 50 MB).");
  }

  const normalized = trimmed.toUpperCase();
  if (!normalized.includes("CREATE TABLE") && !normalized.includes("INSERT INTO")) {
    throw new DatabaseImportError(
      "Die Datei enthält kein gültiges Open-Bookmark-Backup (CREATE TABLE oder INSERT INTO erwartet).",
    );
  }

  const forbidden = ["ATTACH ", "DETACH ", "PRAGMA database_list"];
  for (const pattern of forbidden) {
    if (normalized.includes(pattern)) {
      throw new DatabaseImportError("Die SQL-Datei enthält nicht erlaubte Befehle.");
    }
  }
}

function removeDatabaseFiles(databasePath: string): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    const filePath = suffix ? `${databasePath}${suffix}` : databasePath;
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}

/**
 * Replaces the database file at `databasePath` with the contents of a SQL dump.
 * Closes the process-wide singleton when used from the Nitro server.
 */
export function importDatabaseFromSqlAtPath(
  databasePath: string,
  sqlContent: string,
): void {
  validateSqlImport(sqlContent);

  closeDb();
  mkdirSync(dirname(databasePath), { recursive: true });
  removeDatabaseFiles(databasePath);

  const database = new Database(databasePath);
  try {
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = OFF");
    database.exec(sqlContent);
    database.pragma("foreign_keys = ON");
    database.pragma("wal_checkpoint(TRUNCATE)");
  } catch (error: unknown) {
    removeDatabaseFiles(databasePath);
    const fresh = new Database(databasePath);
    try {
      initSchema(fresh);
    } finally {
      fresh.close();
    }

    const message =
      error instanceof Error
        ? error.message
        : "SQL-Import fehlgeschlagen.";
    throw new DatabaseImportError(message);
  } finally {
    database.close();
  }
}

export function importDatabaseFromSql(sqlContent: string, databasePath: string): void {
  importDatabaseFromSqlAtPath(databasePath, sqlContent);
}
