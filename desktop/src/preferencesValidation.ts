import path from "node:path";

export function isValidDatabasePath(value: string): boolean {
  return path.isAbsolute(value) && value.endsWith(".db");
}
