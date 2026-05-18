const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("openBookmarkDesktop", {
  isDesktopShell: true,
  getInfo: () => ipcRenderer.invoke("desktop:getInfo"),
  openExternal: (url) => ipcRenderer.invoke("desktop:openExternal", url),
  showItemInFolder: (targetPath) =>
    ipcRenderer.invoke("desktop:showItemInFolder", targetPath),
  openExtensionFolder: () => ipcRenderer.invoke("desktop:openExtensionFolder"),
  pickDatabaseDirectory: () => ipcRenderer.invoke("desktop:pickDatabaseDirectory"),
  relocateDatabase: (targetDirectory) =>
    ipcRenderer.invoke("desktop:relocateDatabase", targetDirectory),
  saveBackupFile: (defaultName, bytes) =>
    ipcRenderer.invoke("desktop:saveBackupFile", defaultName, bytes),
  importDatabase: () => ipcRenderer.invoke("desktop:importDatabase"),
});
