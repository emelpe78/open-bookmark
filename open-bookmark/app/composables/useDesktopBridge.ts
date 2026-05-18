import type { OpenBookmarkDesktopApi } from "~/types/desktop";

export type OpenExtensionFolderResult =
  | { ok: true }
  | { ok: false; message: string };

declare global {
  interface Window {
    __OPEN_BOOKMARK_DESKTOP__?: boolean;
  }
}

function readDesktopApi(): OpenBookmarkDesktopApi | undefined {
  if (!import.meta.client) {
    return undefined;
  }
  return window.openBookmarkDesktop;
}

function isDesktopShellClient(): boolean {
  if (!import.meta.client) {
    return false;
  }
  return (
    window.__OPEN_BOOKMARK_DESKTOP__ === true
    || window.openBookmarkDesktop?.isDesktopShell === true
  );
}

export function useDesktopBridge() {
  const runtimeConfig = useRuntimeConfig();

  const api = computed(() => readDesktopApi());

  const isElectron = computed(() => {
    const desktop = api.value;
    return (
      isDesktopShellClient()
      || Boolean(desktop?.isDesktopShell)
      || Boolean(desktop)
      || runtimeConfig.public.isDesktop === true
    );
  });

  async function openExtensionFolder(): Promise<OpenExtensionFolderResult> {
    const desktop = api.value;
    if (!desktop) {
      return {
        ok: false,
        message: "Ordner öffnen ist nur in der Desktop-App verfügbar.",
      };
    }

    try {
      await desktop.openExtensionFolder();
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
    const desktop = api.value;
    if (desktop) {
      await desktop.openExternal("chrome://extensions");
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
