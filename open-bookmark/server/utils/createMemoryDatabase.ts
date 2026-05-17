import Database from "better-sqlite3";
import { initSchema } from "./db";

export function createMemoryDatabase(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  return db;
}
