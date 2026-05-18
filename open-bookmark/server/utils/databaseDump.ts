import type Database from "better-sqlite3";

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }
  if (typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export function dumpDatabaseToSql(database: Database.Database): string {
  database.pragma("wal_checkpoint(FULL)");

  const lines: string[] = [
    "-- Open Bookmark database backup",
    `-- Created: ${new Date().toISOString()}`,
    "PRAGMA foreign_keys=OFF;",
    "BEGIN TRANSACTION;",
  ];

  const schemaRows = database
    .prepare(
      `SELECT type, name, sql
       FROM sqlite_master
       WHERE sql IS NOT NULL
         AND name NOT LIKE 'sqlite_%'
       ORDER BY
         CASE type
           WHEN 'table' THEN 0
           WHEN 'index' THEN 1
           WHEN 'trigger' THEN 2
           ELSE 3
         END,
         name`,
    )
    .all() as Array<{ type: string; name: string; sql: string }>;

  for (const row of schemaRows) {
    lines.push(`${row.sql};`);
  }

  const tables = database
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`,
    )
    .all() as Array<{ name: string }>;

  for (const { name } of tables) {
    const tableName = quoteIdentifier(name);
    const rows = database.prepare(`SELECT * FROM ${tableName}`).all() as Record<
      string,
      unknown
    >[];

    for (const row of rows) {
      const columns = Object.keys(row).map(quoteIdentifier);
      const values = Object.values(row).map(sqlLiteral);
      lines.push(
        `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")});`,
      );
    }
  }

  lines.push("COMMIT;", "PRAGMA foreign_keys=ON;");
  return `${lines.join("\n")}\n`;
}
