import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  isValidSqliteFile,
  planDatabaseRelocation,
  resolveTargetDatabasePath,
} from "../src/database/relocateDatabase.js";

const SQLITE_MAGIC = Buffer.from("SQLite format 3\0");

function tempDir(): string {
  return mkdtempSync(path.join(tmpdir(), "open-bookmark-desktop-"));
}

function writeSqlitePlaceholder(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const buffer = Buffer.alloc(SQLITE_MAGIC.length + 8);
  SQLITE_MAGIC.copy(buffer);
  writeFileSync(filePath, buffer);
}

describe("relocateDatabase", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    dirs.length = 0;
  });

  it("resolveTargetDatabasePath joins directory and bookmarks.db", () => {
    expect(resolveTargetDatabasePath("/tmp/data")).toBe("/tmp/data/bookmarks.db");
  });

  it("planDatabaseRelocation returns copy when target is missing", () => {
    const dir = tempDir();
    dirs.push(dir);
    const current = path.join(dir, "current", "bookmarks.db");
    const targetDir = path.join(dir, "target");

    const plan = planDatabaseRelocation(current, targetDir);
    expect(plan.mode).toBe("copy");
    expect(plan.targetPath).toBe(path.join(targetDir, "bookmarks.db"));
  });

  it("planDatabaseRelocation returns useExisting for valid sqlite at target", () => {
    const dir = tempDir();
    dirs.push(dir);
    const current = path.join(dir, "current", "bookmarks.db");
    const targetPath = path.join(dir, "target", "bookmarks.db");
    writeSqlitePlaceholder(targetPath);

    const plan = planDatabaseRelocation(current, path.join(dir, "target"));
    expect(plan.mode).toBe("useExisting");
    expect(plan.targetPath).toBe(targetPath);
  });

  it("isValidSqliteFile rejects non-sqlite files", () => {
    const dir = tempDir();
    dirs.push(dir);
    const filePath = path.join(dir, "not-db.txt");
    writeFileSync(filePath, "hello");
    expect(isValidSqliteFile(filePath)).toBe(false);
  });

  it("isValidSqliteFile accepts sqlite magic header", () => {
    const dir = tempDir();
    dirs.push(dir);
    const filePath = path.join(dir, "bookmarks.db");
    writeSqlitePlaceholder(filePath);
    expect(isValidSqliteFile(filePath)).toBe(true);
  });
});
