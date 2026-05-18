import { dumpDatabaseToSql } from "../../utils/databaseDump";
import { getDb } from "../../utils/db";

function backupFilename(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    "open-bookmark-backup",
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    ".sql",
  ].join("");
}

export default defineEventHandler((event) => {
  const database = getDb();
  const sql = dumpDatabaseToSql(database);
  const filename = backupFilename(new Date());

  setResponseHeader(event, "Content-Type", "application/sql; charset=utf-8");
  setResponseHeader(
    event,
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );

  return sql;
});
