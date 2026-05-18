import { BrowserWindow, Menu, shell } from "electron";
import { showAboutDialog } from "./aboutDialog.js";
import { APP_DISPLAY_NAME } from "./appMetadata.js";
import { BASE_URL } from "./runtime/constants.js";

export function buildApplicationMenu(mainWindow: BrowserWindow): void {
  const isMac = process.platform === "darwin";

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: APP_DISPLAY_NAME,
            submenu: [
              {
                label: `Über ${APP_DISPLAY_NAME}`,
                click: () => {
                  void showAboutDialog();
                },
              },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "Datei",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    {
      label: "Bearbeiten",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "Ansicht",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Fenster",
      submenu: [{ role: "minimize" }, { role: "zoom" }],
    },
    {
      label: "Hilfe",
      submenu: [
        {
          label: "Browser-Erweiterung",
          click: () => {
            void mainWindow.loadURL(`${BASE_URL}/extension`);
          },
        },
        {
          label: "Chrome-Erweiterungen öffnen",
          click: () => {
            void shell.openExternal("chrome://extensions");
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
