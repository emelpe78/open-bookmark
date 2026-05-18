import type { OpenBookmarkDesktopApi } from "~/types/desktop";

export type OpenExtensionFolderResult =
  | { ok: true }
  | { ok: false; message: string };

export function useDesktopBridge() {
  const api = import.meta.client
    ? (window.openBookmarkDesktop as OpenBookmarkDesktopApi | undefined)
    : undefined;

  const isElectron = computed(() => Boolean(api));

  async function openExtensionFolder(): Promise<OpenExtensionFolderResult> {
    if (!api) {
      return {
        ok: false,
        message: "Ordner öffnen ist nur in der Desktop-App verfügbar.",
      };
    }

    try {
      await api.openExtensionFolder();
      return { ok: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Der Extension-Ordner konnte nicht geöffnet werden.";
      return { ok: false, message };
    }
  }

  async function openChromeExtensions(): Promise<void> {
    if (api) {
      await api.openExternal("chrome://extensions");
      return;
    }
    if (import.meta.client) {
      window.open("chrome://extensions", "_blank");
    }
  }

  return {
    api,
    isElectron,
    openExtensionFolder,
    openChromeExtensions,
  };
}
