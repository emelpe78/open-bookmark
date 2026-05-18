import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { BookmarkRepository } from "../../server/repositories/bookmarkRepository";
import { dumpDatabaseToSql } from "../../server/utils/databaseDump";
import {
  DatabaseImportError,
  importDatabaseFromSqlAtPath,
  validateSqlImport,
} from "../../server/utils/databaseImport";
import { createMemoryDatabase } from "../../server/utils/createMemoryDatabase";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unlinkSync } from "node:fs";

describe("validateSqlImport", () => {
  it("rejects empty content", () => {
    expect(() => validateSqlImport("")).toThrow(DatabaseImportError);
  });

  it("accepts dump output", () => {
    const db = createMemoryDatabase();
    const sql = dumpDatabaseToSql(db);
    db.close();
    expect(() => validateSqlImport(sql)).not.toThrow();
  });
});

describe("importDatabaseFromSqlAtPath", () => {
  it("replaces database contents from a SQL dump", () => {
    const source = createMemoryDatabase();
    const bookmarkRepo = new BookmarkRepository(source);
    bookmarkRepo.insert({
      url: "https://import.example",
      normalized_url: "https://import.example",
      title: "Import me",
      description: null,
      image_url: null,
      site_name: null,
      notes: null,
    });
    const dump = dumpDatabaseToSql(source);
    source.close();

    const targetPath = join(tmpdir(), `ob-import-${Date.now()}.db`);
    const empty = new Database(targetPath);
    empty.close();

    try {
      importDatabaseFromSqlAtPath(targetPath, dump);

      const restored = new Database(targetPath, { readonly: true });
      const count = restored
        .prepare("SELECT COUNT(*) AS count FROM bookmarks")
        .get() as { count: number };
      const title = restored
        .prepare("SELECT title FROM bookmarks LIMIT 1")
        .get() as { title: string };
      restored.close();

      expect(count.count).toBe(1);
      expect(title.title).toBe("Import me");
    } finally {
      for (const suffix of ["", "-wal", "-shm"]) {
        try {
          unlinkSync(`${targetPath}${suffix}`);
        } catch {
          // ignore
        }
      }
    }
  });
});
