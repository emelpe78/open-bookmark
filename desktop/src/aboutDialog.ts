import { app, BrowserWindow } from "electron";
import { existsSync } from "node:fs";
import path from "node:path";
import { APP_DISPLAY_NAME, loadAppMetadata } from "./appMetadata.js";

let aboutWindow: BrowserWindow | null = null;

function aboutHtmlPath(): string | null {
  const candidates = [
    path.join(app.getAppPath(), "resources", "about.html"),
    path.join(process.cwd(), "resources", "about.html"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/** Centered About panel with our favicon (native showMessageBox ignores custom icons on macOS). */
export async function showAboutDialog(): Promise<void> {
  const htmlPath = aboutHtmlPath();
  if (!htmlPath) {
    console.error("[Open Bookmark] resources/about.html fehlt.");
    return;
  }

  if (aboutWindow && !aboutWindow.isDestroyed()) {
    aboutWindow.show();
    aboutWindow.focus();
    return;
  }

  const meta = loadAppMetadata();
  const year = new Date().getFullYear();
  const parent = BrowserWindow.getFocusedWindow() ?? undefined;

  aboutWindow = new BrowserWindow({
    parent,
    modal: parent !== undefined,
    width: 320,
    height: 360,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    title: `Über ${APP_DISPLAY_NAME}`,
    backgroundColor: "#2a2a2a",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  aboutWindow.setMenu(null);

  const win = aboutWindow;

  const reveal = (): void => {
    if (!win.isDestroyed()) {
      win.show();
      win.focus();
    }
  };

  win.once("ready-to-show", reveal);

  try {
    await win.loadFile(htmlPath, {
      query: {
        name: meta.name,
        version: meta.version,
        copyright: `Copyright (c) ${year} Marc Lettau-Poelchen`,
      },
    });

    // ready-to-show may have fired before the listener was attached
    if (!win.isDestroyed() && !win.isVisible()) {
      reveal();
    }
  } catch (error) {
    console.error("[Open Bookmark] About-Fenster konnte nicht geladen werden:", error);
    if (!win.isDestroyed()) {
      win.destroy();
    }
    aboutWindow = null;
    return;
  }

  win.on("closed", () => {
    aboutWindow = null;
  });
}

export { APP_DISPLAY_NAME };
