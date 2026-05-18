import { contextBridge, ipcRenderer } from "electron";

export interface DesktopInfo {
  baseUrl: string;
  extensionDistPath: string;
  databasePath: string;
  isPackaged: boolean;
}

contextBridge.exposeInMainWorld("openBookmarkDesktop", {
  getInfo: (): Promise<DesktopInfo> => ipcRenderer.invoke("desktop:getInfo"),
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke("desktop:openExternal", url),
  showItemInFolder: (targetPath: string): Promise<void> =>
    ipcRenderer.invoke("desktop:showItemInFolder", targetPath),
  openExtensionFolder: (): Promise<void> =>
    ipcRenderer.invoke("desktop:openExtensionFolder"),
});
