import type { OpenBookmarkDesktopApi } from "~/types/desktop";

export function useDesktopBridge() {
  const api = import.meta.client
    ? (window.openBookmarkDesktop as OpenBookmarkDesktopApi | undefined)
    : undefined;

  const isElectron = computed(() => Boolean(api));

  async function openExtensionFolder(): Promise<boolean> {
    if (!api) {
      return false;
    }
    await api.openExtensionFolder();
    return true;
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
