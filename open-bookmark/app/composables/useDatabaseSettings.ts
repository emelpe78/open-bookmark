import type { DatabaseInfo } from "#shared/types/database";
import type { OpenBookmarkDesktopApi } from "~/types/desktop";
import { extractFetchError } from "../utils/extractFetchError";

export type RelocateDatabaseMode = "copy" | "useExisting";

export interface RelocateDatabaseResult {
  databasePath: string;
  mode: RelocateDatabaseMode;
}

function defaultBackupFilename(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    "open-bookmark-backup",
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    ".sql",
  ].join("");
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }

  const match = /filename="([^"]+)"/.exec(header);
  return match?.[1] ?? null;
}

function targetDatabasePath(directory: string): string {
  const trimmed = directory.replace(/\/+$/, "");
  return `${trimmed}/bookmarks.db`;
}

export function useDatabaseSettings() {
  const { api, isElectron } = useDesktopBridge();
  const toast = useToast();

  const info = ref<DatabaseInfo | null>(null);
  const isDesktopDatabase = computed(
    () => info.value?.isDesktop === true || isElectron.value,
  );
  const canChangePath = computed(() => isDesktopDatabase.value);

  function requireDesktopApi(): OpenBookmarkDesktopApi | null {
    const desktop = api.value;
    if (!desktop) {
      toast.add({
        title: "Desktop-Verbindung fehlt",
        description:
          "Bitte die Desktop-App neu starten. Im Finder sollte „Open Bookmark“ stehen, nicht „Electron“.",
        color: "error",
      });
      return null;
    }
    return desktop;
  }
  const pending = ref(false);
  const error = ref<string | null>(null);
  const backupLoading = ref(false);
  const importLoading = ref(false);
  const relocateLoading = ref(false);
  const importModalOpen = ref(false);
  const sqlFileInput = ref<HTMLInputElement | null>(null);

  const relocateModalOpen = ref(false);
  const pendingRelocateDirectory = ref<string | null>(null);

  const pendingTargetPath = computed(() => {
    if (!pendingRelocateDirectory.value) {
      return null;
    }
    return targetDatabasePath(pendingRelocateDirectory.value);
  });

  async function refresh(): Promise<void> {
    pending.value = true;
    error.value = null;
    try {
      const [fetched, desktopInfo] = await Promise.all([
        $fetch<DatabaseInfo>("/api/database"),
        api.value?.getInfo(),
      ]);

      info.value = {
        ...fetched,
        path: desktopInfo?.databasePath ?? fetched.path,
        isDesktop: fetched.isDesktop || Boolean(desktopInfo),
      };
    } catch (caught: unknown) {
      error.value = extractFetchError(caught);
      info.value = null;
    } finally {
      pending.value = false;
    }
  }

  async function showInFinder(): Promise<void> {
    const desktop = requireDesktopApi();
    if (!desktop || !info.value?.path) {
      return;
    }

    try {
      await desktop.showItemInFolder(info.value.path);
    } catch (caught: unknown) {
      toast.add({
        title: "Finder konnte nicht geöffnet werden",
        description: extractFetchError(caught),
        color: "error",
      });
    }
  }

  async function startRelocate(): Promise<void> {
    const desktop = requireDesktopApi();
    if (!desktop) {
      return;
    }

    try {
      const directory = await desktop.pickDatabaseDirectory();
      if (!directory) {
        return;
      }
      pendingRelocateDirectory.value = directory;
      relocateModalOpen.value = true;
    } catch (caught: unknown) {
      toast.add({
        title: "Ordnerauswahl fehlgeschlagen",
        description: extractFetchError(caught),
        color: "error",
      });
    }
  }

  function cancelRelocate(): void {
    relocateModalOpen.value = false;
    pendingRelocateDirectory.value = null;
  }

  async function confirmRelocate(): Promise<RelocateDatabaseResult | null> {
    const desktop = requireDesktopApi();
    if (!desktop || !pendingRelocateDirectory.value) {
      return null;
    }

    relocateLoading.value = true;
    try {
      const result = await desktop.relocateDatabase(pendingRelocateDirectory.value);
      relocateModalOpen.value = false;
      pendingRelocateDirectory.value = null;
      await refresh();
      return result;
    } catch (caught: unknown) {
      toast.add({
        title: "Datenbank konnte nicht verschoben werden",
        description: extractFetchError(caught),
        color: "error",
      });
      return null;
    } finally {
      relocateLoading.value = false;
    }
  }

  function openImportModal(): void {
    importModalOpen.value = true;
  }

  function cancelImport(): void {
    importModalOpen.value = false;
  }

  function startSqlFilePick(): void {
    sqlFileInput.value?.click();
  }

  async function importSqlContent(sql: string): Promise<DatabaseInfo | null> {
    importLoading.value = true;
    try {
      const result = await $fetch<DatabaseInfo>("/api/database/import", {
        method: "POST",
        body: sql,
        headers: { "Content-Type": "application/sql" },
      });
      importModalOpen.value = false;
      info.value = {
        ...result,
        path: api.value ? (await api.value.getInfo())?.databasePath ?? result.path : result.path,
        isDesktop: result.isDesktop || Boolean(api.value),
      };
      await reloadNuxtApp();
      return result;
    } catch (caught: unknown) {
      toast.add({
        title: "Import fehlgeschlagen",
        description: extractFetchError(caught),
        color: "error",
      });
      return null;
    } finally {
      importLoading.value = false;
    }
  }

  async function confirmImport(): Promise<boolean> {
    const desktop = api.value;
    if (desktop) {
      importLoading.value = true;
      try {
        const result = await desktop.importDatabase();
        if (!result.imported) {
          importModalOpen.value = false;
          return false;
        }
        importModalOpen.value = false;
        await refresh();
        return true;
      } catch (caught: unknown) {
        toast.add({
          title: "Import fehlgeschlagen",
          description: extractFetchError(caught),
          color: "error",
        });
        return false;
      } finally {
        importLoading.value = false;
      }
    }

    importModalOpen.value = false;
    startSqlFilePick();
    return false;
  }

  async function onSqlFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";

    if (!file) {
      return;
    }

    const sql = await file.text();
    const result = await importSqlContent(sql);
    if (result) {
      toast.add({
        title: "Datenbank importiert",
        description: "Alle Lesezeichen wurden aus dem SQL-Backup übernommen.",
        color: "success",
      });
    }
  }

  async function createBackup(): Promise<string | null> {
    backupLoading.value = true;
    try {
      const response = await fetch("/api/database/backup");
      if (!response.ok) {
        throw new Error("Backup konnte nicht erstellt werden.");
      }

      const blob = await response.blob();
      const filename =
        filenameFromContentDisposition(response.headers.get("Content-Disposition"))
        ?? defaultBackupFilename();
      const bytes = new Uint8Array(await blob.arrayBuffer());

      const desktop = api.value;
      if (desktop) {
        const result = await desktop.saveBackupFile(filename, bytes);
        if (!result.saved) {
          return null;
        }
        return result.filePath;
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      return filename;
    } catch (caught: unknown) {
      toast.add({
        title: "Backup fehlgeschlagen",
        description: extractFetchError(caught),
        color: "error",
      });
      return null;
    } finally {
      backupLoading.value = false;
    }
  }

  function formatBytes(bytes: number | null): string {
    if (bytes === null) {
      return "—";
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  onMounted(() => {
    void refresh();
  });

  return {
    info,
    pending,
    error,
    backupLoading,
    importLoading,
    relocateLoading,
    relocateModalOpen,
    importModalOpen,
    sqlFileInput,
    pendingTargetPath,
    isElectron,
    canChangePath,
    isDesktopDatabase,
    refresh,
    showInFinder,
    startRelocate,
    cancelRelocate,
    confirmRelocate,
    openImportModal,
    cancelImport,
    confirmImport,
    onSqlFileSelected,
    createBackup,
    formatBytes,
  };
}
