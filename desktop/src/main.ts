import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
} from "electron";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_DISPLAY_NAME, configureAppBranding } from "./appMetadata.js";
import { configureDockIcon, loadAppIcon } from "./appIcon.js";
import { buildApplicationMenu } from "./menu.js";
import { BASE_URL } from "./runtime/constants.js";
import { resolveRuntimePaths } from "./runtime/paths.js";
import {
  getRuntimePaths,
  startRuntime,
  stopRuntime,
} from "./runtime/startRuntime.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

configureAppBranding();

let mainWindow: BrowserWindow | null = null;

function preloadPath(): string {
  return path.join(moduleDir, "preload.js");
}

function errorPageUrl(message: string): string {
  const htmlPath = path.join(app.getAppPath(), "src", "error.html");
  return `file://${htmlPath}?message=${encodeURIComponent(message)}`;
}

async function createMainWindow(): Promise<void> {
  const icon = loadAppIcon();
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: APP_DISPLAY_NAME,
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      sandbox: true,
    },
  });

  buildApplicationMenu(mainWindow);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  await mainWindow.loadURL(`${BASE_URL}/bookmarks`);
}

function showErrorWindow(message: string): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    void mainWindow.loadURL(errorPageUrl(message));
    mainWindow.show();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 640,
    height: 480,
    title: `${APP_DISPLAY_NAME} — Fehler`,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });
  void mainWindow.loadURL(errorPageUrl(message));
}

function registerIpcHandlers(): void {
  ipcMain.handle("desktop:getInfo", () => {
    const paths = getRuntimePaths() ?? resolveRuntimePaths();
    return {
      baseUrl: BASE_URL,
      extensionDistPath: paths.extensionDistPath,
      databasePath: paths.databasePath,
      isPackaged: app.isPackaged,
    };
  });

  ipcMain.handle("desktop:openExternal", (_event, url: string) => {
    if (typeof url !== "string" || !/^(https?|chrome):\/\//.test(url)) {
      throw new Error("Ungültige URL");
    }
    return shell.openExternal(url);
  });

  ipcMain.handle("desktop:showItemInFolder", (_event, targetPath: string) => {
    if (typeof targetPath !== "string" || !targetPath.trim()) {
      throw new Error("Ungültiger Pfad");
    }
    shell.showItemInFolder(targetPath);
  });

  ipcMain.handle("desktop:openExtensionFolder", async () => {
    const paths = getRuntimePaths() ?? resolveRuntimePaths();
    let target = paths.extensionDistPath;

    if (!existsSync(target)) {
      const parent = path.dirname(target);
      if (existsSync(parent)) {
        target = parent;
      } else {
        mkdirSync(target, { recursive: true });
      }
    }

    const error = await shell.openPath(target);
    if (error) {
      throw new Error(error);
    }
  });
}

async function bootstrap(): Promise<void> {
  registerIpcHandlers();

  try {
    await startRuntime();
    await createMainWindow();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unbekannter Startfehler.";
    showErrorWindow(message);
  }
}

app.whenReady().then(() => {
  setImmediate(() => configureDockIcon());
  void bootstrap();

  app.on("activate", () => {
    configureDockIcon();
    if (BrowserWindow.getAllWindows().length === 0) {
      void bootstrap();
    }
  });
});

app.on("before-quit", () => {
  stopRuntime();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
