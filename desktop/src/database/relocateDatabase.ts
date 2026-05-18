import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SQLITE_MAGIC = Buffer.from("SQLite format 3\0");

export type RelocateDatabaseMode = "copy" | "useExisting";

export interface RelocateDatabasePlan {
  targetPath: string;
  mode: RelocateDatabaseMode;
}

export function resolveTargetDatabasePath(targetDirectory: string): string {
  return path.join(targetDirectory, "bookmarks.db");
}

export function planDatabaseRelocation(
  currentPath: string,
  targetDirectory: string,
): RelocateDatabasePlan {
  const targetPath = resolveTargetDatabasePath(targetDirectory);

  if (!existsSync(targetPath)) {
    return { targetPath, mode: "copy" };
  }

  if (!isValidSqliteFile(targetPath)) {
    throw new Error(
      "Am Zielort liegt bereits eine Datei bookmarks.db, die keine gültige SQLite-Datenbank ist.",
    );
  }

  if (path.resolve(targetPath) === path.resolve(currentPath)) {
    throw new Error("Die Datenbank befindet sich bereits an diesem Speicherort.");
  }

  return { targetPath, mode: "useExisting" };
}

export function isValidSqliteFile(filePath: string): boolean {
  if (!existsSync(filePath)) {
    return false;
  }

  const header = readFileSync(filePath).subarray(0, SQLITE_MAGIC.length);
  return header.equals(SQLITE_MAGIC);
}

function copyIfExists(sourcePath: string, targetPath: string): void {
  if (!existsSync(sourcePath)) {
    return;
  }
  copyFileSync(sourcePath, targetPath);
}

export function relocateDatabaseFiles(
  currentPath: string,
  plan: RelocateDatabasePlan,
): void {
  if (plan.mode === "useExisting") {
    return;
  }

  mkdirSync(path.dirname(plan.targetPath), { recursive: true });
  copyIfExists(currentPath, plan.targetPath);
  copyIfExists(`${currentPath}-wal`, `${plan.targetPath}-wal`);
  copyIfExists(`${currentPath}-shm`, `${plan.targetPath}-shm`);
}
