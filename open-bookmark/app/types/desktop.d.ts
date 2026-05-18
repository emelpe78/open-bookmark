export type RelocateDatabaseMode = "copy" | "useExisting";

export interface RelocateDatabaseResult {
  databasePath: string;
  mode: RelocateDatabaseMode;
}

export type SaveBackupFileResult =
  | { saved: false }
  | { saved: true; filePath: string };

export type ImportDatabaseResult =
  | { imported: false }
  | { imported: true; databasePath: string; sourcePath: string };

export interface OpenBookmarkDesktopApi {
  /** Set by preload when the Electron shell is active. */
  isDesktopShell?: boolean;
  getInfo: () => Promise<{
    baseUrl: string;
    extensionDistPath: string;
    databasePath: string;
    isPackaged: boolean;
  }>;
  openExternal: (url: string) => Promise<void>;
  showItemInFolder: (targetPath: string) => Promise<void>;
  openExtensionFolder: () => Promise<void>;
  pickDatabaseDirectory: () => Promise<string | null>;
  relocateDatabase: (targetDirectory: string) => Promise<RelocateDatabaseResult>;
  saveBackupFile: (
    defaultName: string,
    bytes: Uint8Array,
  ) => Promise<SaveBackupFileResult>;
  importDatabase: () => Promise<ImportDatabaseResult>;
}

declare global {
  interface Window {
    openBookmarkDesktop?: OpenBookmarkDesktopApi;
  }
}

export {};
