import { getDatabaseInfo } from "../../utils/databaseInfo";
import {
  DatabaseImportError,
  importDatabaseFromSqlAtPath,
} from "../../utils/databaseImport";
import { getDb, resolveConfiguredDatabasePath } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const sql = await readRawBody(event, "utf8");
  if (!sql?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Leere SQL-Datei.",
    });
  }

  const databasePath = resolveConfiguredDatabasePath();

  try {
    importDatabaseFromSqlAtPath(databasePath, sql);
  } catch (error: unknown) {
    if (error instanceof DatabaseImportError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message,
      });
    }
    throw error;
  }

  const database = getDb();
  return getDatabaseInfo(database, databasePath);
});
