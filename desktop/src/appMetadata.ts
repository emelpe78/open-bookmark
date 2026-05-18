import { readFileSync } from "node:fs";
import path from "node:path";
import { app } from "electron";
import { resolveAboutIconPath } from "./appIcon.js";

/** macOS menu bar and About dialog — human-readable product name. */
export const APP_DISPLAY_NAME = "Open Bookmark";

export interface AppMetadata {
  name: string;
  version: string;
}

export function loadAppMetadata(): AppMetadata {
  const pkgPath = path.join(app.getAppPath(), "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };

  return {
    name: APP_DISPLAY_NAME,
    version: typeof pkg.version === "string" ? pkg.version : "0.0.0",
  };
}

export function configureAppBranding(): void {
  const meta = loadAppMetadata();

  if (process.platform === "darwin") {
    // Menu bar, About, and Dock tooltip in dev (with patched Electron.app Info.plist).
    app.setName(meta.name);
  }

  const aboutIconPath = resolveAboutIconPath();

  app.setAboutPanelOptions({
    applicationName: meta.name,
    applicationVersion: meta.version,
    version: meta.version,
    copyright: `Copyright © ${new Date().getFullYear()} Marc Lettau-Poelchen`,
    ...(aboutIconPath ? { iconPath: aboutIconPath } : {}),
  });
}

/** Re-apply after `app.whenReady()` so macOS picks up the display name. */
export function applyDarwinDisplayName(): void {
  if (process.platform === "darwin") {
    app.setName(APP_DISPLAY_NAME);
  }
}
