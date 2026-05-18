import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
} from "electron";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  planDatabaseRelocation,
  relocateDatabaseFiles,
} from "./database/relocateDatabase.js";
import { savePreferences } from "./preferences.js";
import { fileURLToPath } from "node:url";
import {
  APP_DISPLAY_NAME,
  applyDarwinDisplayName,
  configureAppBranding,
} from "./appMetadata.js";
import { configureDockIcon, loadAppIcon } from "./appIcon.js";
import { buildApplicationMenu } from "./menu.js";
import { BASE_URL } from "./runtime/constants.js";
import {
  ensureDatabaseDirectory,
  resolveRuntimePaths,
} from "./runtime/paths.js";
import { runDatabaseImport } from "./runtime/runDatabaseImport.js";
import {
  getRuntimePaths,
  restartRuntime,
  startRuntime,
  stopRuntime,
} from "./runtime/startRuntime.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

configureAppBranding();

let mainWindow: BrowserWindow | null = null;

function preloadPath(): string {
  return path.join(moduleDir, "preload.cjs");
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
      sandbox: false,
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

  ipcMain.handle("desktop:pickDatabaseDirectory", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
      title: "Ordner für die Datenbank wählen",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0] ?? null;
  });

  ipcMain.handle(
    "desktop:relocateDatabase",
    async (_event, targetDirectory: string) => {
      if (typeof targetDirectory !== "string" || !targetDirectory.trim()) {
        throw new Error("Ungültiger Ordner.");
      }

      const paths = getRuntimePaths() ?? resolveRuntimePaths();
      const plan = planDatabaseRelocation(
        paths.databasePath,
        targetDirectory,
      );

      await stopRuntime();
      relocateDatabaseFiles(paths.databasePath, plan);
      savePreferences({ databasePath: plan.targetPath });
      const newPaths = await restartRuntime();

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.reload();
      }

      return {
        databasePath: newPaths.databasePath,
        mode: plan.mode,
      };
    },
  );

  ipcMain.handle(
    "desktop:saveBackupFile",
    async (_event, defaultName: string, bytes: Uint8Array) => {
      if (typeof defaultName !== "string" || !defaultName.trim()) {
        throw new Error("Ungültiger Dateiname.");
      }
      if (!(bytes instanceof Uint8Array)) {
        throw new Error("Ungültige Backup-Daten.");
      }

      const result = await dialog.showSaveDialog({
        defaultPath: defaultName,
        filters: [{ name: "SQL", extensions: ["sql"] }],
        title: "Backup speichern",
      });

      if (result.canceled || !result.filePath) {
        return { saved: false as const };
      }

      writeFileSync(result.filePath, Buffer.from(bytes));
      return { saved: true as const, filePath: result.filePath };
    },
  );

  ipcMain.handle("desktop:importDatabase", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "SQL", extensions: ["sql"] }],
      title: "SQL-Backup importieren",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { imported: false as const };
    }

    const filePath = result.filePaths[0];
    if (!filePath) {
      return { imported: false as const };
    }

    const paths = getRuntimePaths() ?? resolveRuntimePaths();

    await stopRuntime();
    try {
      await runDatabaseImport(paths, filePath);
    } catch (error: unknown) {
      await restartRuntime();
      const message =
        error instanceof Error ? error.message : "SQL-Import fehlgeschlagen.";
      throw new Error(message);
    }

    const newPaths = await restartRuntime();

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload();
    }

    return {
      imported: true as const,
      databasePath: newPaths.databasePath,
      sourcePath: filePath,
    };
  });
}

async function bootstrap(): Promise<void> {
  registerIpcHandlers();

  try {
    ensureDatabaseDirectory();
    await startRuntime();
    await createMainWindow();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unbekannter Startfehler.";
    showErrorWindow(message);
  }
}

app.whenReady().then(() => {
  applyDarwinDisplayName();
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
  void stopRuntime();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
