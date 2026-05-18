import { getDatabaseInfo } from "../../utils/databaseInfo";
import { getDb, resolveConfiguredDatabasePath } from "../../utils/db";

export default defineEventHandler(() => {
  const database = getDb();
  const path = resolveConfiguredDatabasePath();
  return getDatabaseInfo(database, path);
});
