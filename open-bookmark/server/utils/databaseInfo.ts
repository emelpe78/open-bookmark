import type { DatabaseInfo } from "#shared/types/database";
import { isDesktopDatabaseRuntime } from "./db";
import { existsSync, statSync } from "node:fs";
import type Database from "better-sqlite3";

export function getDatabaseInfo(
  database: Database.Database,
  databasePath: string,
): DatabaseInfo {
  let sizeBytes: number | null = null;
  if (existsSync(databasePath)) {
    sizeBytes = statSync(databasePath).size;
  }

  const row = database
    .prepare("SELECT COUNT(*) AS count FROM bookmarks")
    .get() as { count: number };

  return {
    path: databasePath,
    sizeBytes,
    bookmarkCount: row.count,
    isDesktop: isDesktopDatabaseRuntime(),
  };
}
