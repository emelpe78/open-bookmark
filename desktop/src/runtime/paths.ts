import { app } from "electron";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPreferences } from "../preferences.js";
import { APP_PORT } from "./constants.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export interface RuntimePaths {
  runtimeRoot: string;
  serverEntry: string;
  nodeBinary: string;
  databasePath: string;
  extensionDistPath: string;
  logsDir: string;
}

function repoRootFromDesktop(): string {
  return path.resolve(moduleDir, "../../..");
}

export function getDefaultDatabasePath(): string {
  return path.join(app.getPath("userData"), "bookmarks.db");
}

export function getDatabasePath(): string {
  const preferences = loadPreferences();
  return preferences.databasePath ?? getDefaultDatabasePath();
}

/** Ensures the parent directory exists before Nitro opens the SQLite file. */
export function ensureDatabaseDirectory(): void {
  const databasePath = getDatabasePath();
  mkdirSync(path.dirname(databasePath), { recursive: true });
}

export function resolveRuntimePaths(): RuntimePaths {
  const databasePath = getDatabasePath();
  const logsDir = path.join(app.getPath("userData"), "logs");

  if (app.isPackaged) {
    const resources = process.resourcesPath;
    const runtimeRoot = path.join(resources, "open-bookmark");
    const bundledNode = path.join(resources, "node", "bin", "node");
    const nodeBinary = existsSync(bundledNode) ? bundledNode : process.env.NODE ?? "node";

    return {
      runtimeRoot,
      serverEntry: path.join(runtimeRoot, ".output/server/index.mjs"),
      nodeBinary,
      databasePath,
      extensionDistPath: path.join(resources, "extension-dist"),
      logsDir,
    };
  }

  const runtimeRoot = path.join(repoRootFromDesktop(), "open-bookmark");
  const extensionDist = path.join(repoRootFromDesktop(), "extension", "dist");
  const nodeFromEnv = process.env.NODE;
  const nodeBinary = nodeFromEnv && existsSync(nodeFromEnv) ? nodeFromEnv : "node";

  return {
    runtimeRoot,
    serverEntry: path.join(runtimeRoot, ".output/server/index.mjs"),
    nodeBinary,
    databasePath,
    extensionDistPath: extensionDist,
    logsDir,
  };
}

export function buildRuntimeEnv(paths: RuntimePaths): NodeJS.ProcessEnv {
  return {
    ...process.env,
    NODE_ENV: "production",
    HOST: "127.0.0.1",
    PORT: String(APP_PORT),
    APP_PORT: String(APP_PORT),
    DATABASE_PATH: paths.databasePath,
    NUXT_DATABASE_PATH: paths.databasePath,
    OPEN_BOOKMARK_DESKTOP: "1",
  };
}
