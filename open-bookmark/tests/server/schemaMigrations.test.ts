import { describe, expect, it } from "vitest";
import { initSchema } from "../../server/utils/db";
import { getSchemaVersion, runMigrations } from "../../server/utils/schemaMigrations";
import { createMemoryDatabase } from "../../server/utils/createMemoryDatabase";

describe("schemaMigrations", () => {
  it("sets user_version to 1 on fresh database", () => {
    const db = createMemoryDatabase();
    initSchema(db);
    runMigrations(db);
    expect(getSchemaVersion(db)).toBe(1);
  });

  it("is idempotent when run twice", () => {
    const db = createMemoryDatabase();
    initSchema(db);
    runMigrations(db);
    runMigrations(db);
    expect(getSchemaVersion(db)).toBe(1);
  });
});
