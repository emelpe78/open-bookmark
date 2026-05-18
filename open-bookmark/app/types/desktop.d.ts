export interface OpenBookmarkDesktopApi {
  getInfo: () => Promise<{
    baseUrl: string;
    extensionDistPath: string;
    databasePath: string;
    isPackaged: boolean;
  }>;
  openExternal: (url: string) => Promise<void>;
  showItemInFolder: (targetPath: string) => Promise<void>;
  openExtensionFolder: () => Promise<void>;
}

declare global {
  interface Window {
    openBookmarkDesktop?: OpenBookmarkDesktopApi;
  }
}

export {};
