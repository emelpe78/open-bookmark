import { app, nativeImage } from "electron";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function iconCandidates(): string[] {
  return [
    path.join(app.getAppPath(), "resources", "icon.png"),
    path.join(process.cwd(), "resources", "icon.png"),
    path.join(app.getAppPath(), "resources", "icon.icns"),
    path.join(process.cwd(), "resources", "icon.icns"),
  ];
}

export function resolveAppIconPngPath(): string | null {
  for (const candidate of iconCandidates().slice(0, 2)) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function resolveAboutIconPath(): string | null {
  return resolveAppIconPngPath();
}

/** Load dock/about icon from PNG bytes — .icns via createFromPath is unreliable in dev. */
export function loadAppIcon(): Electron.NativeImage | undefined {
  const pngPath = resolveAppIconPngPath();
  if (!pngPath) {
    return undefined;
  }

  try {
    const image = nativeImage.createFromBuffer(readFileSync(pngPath));
    if (!image.isEmpty()) {
      return image;
    }
  } catch {
    // fall through
  }

  const fromPath = nativeImage.createFromPath(pngPath);
  return fromPath.isEmpty() ? undefined : fromPath;
}

export function configureDockIcon(): void {
  if (process.platform !== "darwin" || !app.dock) {
    return;
  }

  const icon = loadAppIcon();
  if (!icon) {
    console.warn(
      "[Open Bookmark] Dock-Icon nicht gefunden — bitte „npm run icons“ im Ordner desktop ausführen.",
    );
    return;
  }

  app.dock.setIcon(icon);
}
