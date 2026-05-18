import { app } from "electron";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface DesktopPreferences {
  databasePath?: string;
}

function preferencesPath(): string {
  return path.join(app.getPath("userData"), "preferences.json");
}

function isValidDatabasePath(value: string): boolean {
  return path.isAbsolute(value) && value.endsWith(".db");
}

export function loadPreferences(): DesktopPreferences {
  const filePath = preferencesPath();
  if (!existsSync(filePath)) {
    return {};
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as DesktopPreferences;
    if (
      parsed.databasePath !== undefined
      && !isValidDatabasePath(parsed.databasePath)
    ) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

export function savePreferences(preferences: DesktopPreferences): void {
  const next: DesktopPreferences = {};

  if (preferences.databasePath !== undefined) {
    if (!isValidDatabasePath(preferences.databasePath)) {
      throw new Error("Ungültiger Datenbankpfad.");
    }
    next.databasePath = preferences.databasePath;
  }

  writeFileSync(preferencesPath(), `${JSON.stringify(next, null, 2)}\n`, "utf8");
}
