import type Database from "better-sqlite3";

const CURRENT_SCHEMA_VERSION = 1;

type Migration = {
  version: number;
  up: (database: Database.Database) => void;
};

const migrations: Migration[] = [
  {
    version: 1,
    up: () => {
      // Baseline: schema created by initSchema; records version for future ALTER migrations.
    },
  },
];

export function runMigrations(database: Database.Database): void {
  const row = database.pragma("user_version", { simple: true }) as number;
  let currentVersion = typeof row === "number" ? row : 0;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }
    if (migration.version !== currentVersion + 1) {
      throw new Error(
        `Schema-Migration ${migration.version} erwartet Version ${currentVersion + 1}, aktuell ${currentVersion}.`,
      );
    }
    migration.up(database);
    database.pragma(`user_version = ${migration.version}`);
    currentVersion = migration.version;
  }

  if (currentVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Datenbank-Schema ${currentVersion} ist neuer als diese App (${CURRENT_SCHEMA_VERSION}).`,
    );
  }
}

export function getSchemaVersion(database: Database.Database): number {
  const row = database.pragma("user_version", { simple: true }) as number;
  return typeof row === "number" ? row : 0;
}
