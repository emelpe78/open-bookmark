<script setup lang="ts">
const toast = useToast();
const {
  info,
  pending,
  error,
  backupLoading,
  relocateLoading,
  relocateModalOpen,
  pendingTargetPath,
  canChangePath,
  isDesktopDatabase,
  refresh,
  showInFinder,
  startRelocate,
  cancelRelocate,
  confirmRelocate,
  createBackup,
  importLoading,
  importModalOpen,
  htmlImportModalOpen,
  htmlImportSummary,
  sqlFileInput,
  htmlFileInput,
  openImportModal,
  cancelImport,
  confirmImport,
  openHtmlImportModal,
  cancelHtmlImport,
  confirmHtmlImport,
  onSqlFileSelected,
  onHtmlFileSelected,
  formatBytes,
} = useDatabaseSettings();

async function handleCreateBackup(): Promise<void> {
  const savedPath = await createBackup();
  if (!savedPath) {
    return;
  }

  toast.add({
    title: "Backup erstellt",
    description: savedPath,
    color: "success",
  });
}

async function handleConfirmImport(): Promise<void> {
  const ok = await confirmImport();
  if (!ok) {
    return;
  }

  toast.add({
    title: "Datenbank importiert",
    description: "Alle Lesezeichen wurden aus dem SQL-Backup übernommen.",
    color: "success",
  });
}

async function handleConfirmHtmlImport(): Promise<void> {
  await confirmHtmlImport();
}

function closeHtmlImportWithToast(): void {
  if (!htmlImportSummary.value) {
    return;
  }

  const { created, skipped, failed } = htmlImportSummary.value;
  toast.add({
    title: "HTML-Import abgeschlossen",
    description: `${created} angelegt, ${skipped} übersprungen${failed.length ? `, ${failed.length} fehlgeschlagen` : ""}.`,
    color: failed.length ? "warning" : "success",
  });
  htmlImportSummary.value = null;
  cancelHtmlImport();
}

async function handleConfirmRelocate(): Promise<void> {
  const result = await confirmRelocate();
  if (!result) {
    return;
  }

  const description =
    result.mode === "useExisting"
      ? "Es wird nun die vorhandene Datenbank am neuen Speicherort verwendet."
      : "Die Datenbank wurde kopiert und der Dienst neu gestartet.";

  toast.add({
    title: "Speicherort geändert",
    description,
    color: "success",
  });
}
</script>

<template>
  <UFormField
    label="Datenbank"
    description="Speicherort deiner Lesezeichen. Für Cloud-Ordner: nur eine App-Instanz gleichzeitig nutzen; WAL-Dateien können Sync-Dienste stören."
    class="w-full"
  >
    <div class="space-y-3">
      <div v-if="pending" class="flex items-center gap-2 text-sm text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
        Datenbankinformationen werden geladen …
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        variant="subtle"
        title="Datenbankinformationen nicht verfügbar"
        :description="error"
      />

      <template v-else-if="info">
        <UInput
          :model-value="info.path"
          readonly
          class="w-full font-mono text-xs"
        />

        <p class="text-xs text-muted">
          <span v-if="isDesktopDatabase">Desktop-Datenbank · </span>
          <span v-else>Entwicklungs-Datenbank · </span>
          {{ info.bookmarkCount }} Lesezeichen · {{ formatBytes(info.sizeBytes) }}
        </p>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-if="canChangePath"
            label="Im Finder anzeigen"
            icon="i-lucide-folder-open"
            color="neutral"
            variant="outline"
            @click="showInFinder"
          />
          <UButton
            v-if="canChangePath"
            label="Pfad ändern"
            icon="i-lucide-folder-input"
            color="neutral"
            variant="outline"
            :loading="relocateLoading"
            @click="startRelocate"
          />
          <UButton
            label="Backup erstellen"
            icon="i-lucide-database-backup"
            color="neutral"
            variant="outline"
            :loading="backupLoading"
            @click="handleCreateBackup"
          />
          <UButton
            label="SQL importieren"
            icon="i-lucide-upload"
            color="neutral"
            variant="outline"
            :loading="importLoading"
            @click="openImportModal"
          />
          <UButton
            label="HTML importieren"
            icon="i-lucide-file-input"
            color="neutral"
            variant="outline"
            :loading="importLoading"
            @click="openHtmlImportModal"
          />
          <UButton
            label="Aktualisieren"
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="pending"
            @click="refresh"
          />
        </div>

        <UAlert
          v-if="!isDesktopDatabase && !canChangePath"
          color="warning"
          variant="subtle"
          class="mt-1"
          title="Web-Entwicklungsumgebung"
          description="Diese Datenbank liegt nur in ./data/ und ist getrennt von der Desktop-App. Pfad ändern und Finder sind in der Desktop-App verfügbar. Beende npm run dev, wenn du die Desktop-App startest (Port 3777)."
        />
        <p v-else-if="canChangePath" class="text-xs text-muted">
          Nach einem Pfadwechsel startet die App den lokalen Dienst neu. Die bisherige
          Datei in Application Support bleibt als Sicherung erhalten. Bei Problemen kannst du
          <code class="rounded bg-elevated px-1">preferences.json</code>
          im App-Datenordner anpassen.
        </p>
      </template>
    </div>
  </UFormField>

  <input
    ref="sqlFileInput"
    type="file"
    accept=".sql,text/plain"
    class="hidden"
    @change="onSqlFileSelected"
  >

  <input
    ref="htmlFileInput"
    type="file"
    accept=".html,text/html"
    class="hidden"
    @change="onHtmlFileSelected"
  >

  <UModal v-model:open="htmlImportModalOpen" title="Lesezeichen aus HTML importieren?">
    <template #body>
      <p class="text-sm text-muted">
        Wähle eine
        <code class="rounded bg-elevated px-1">bookmarks.html</code>
        (Chrome: Lesezeichen verwalten → Exportieren). URLs werden importiert,
        Duplikate übersprungen. Metadaten werden pro URL geladen — das kann bei
        vielen Lesezeichen dauern.
      </p>
      <div
        v-if="htmlImportSummary"
        class="mt-4 flex flex-col gap-2 rounded-md border border-default p-3 text-sm"
      >
        <p>{{ htmlImportSummary.created }} angelegt</p>
        <p>{{ htmlImportSummary.skipped }} übersprungen</p>
        <p v-if="htmlImportSummary.failed.length">
          {{ htmlImportSummary.failed.length }} fehlgeschlagen
        </p>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <UButton
          v-if="htmlImportSummary"
          label="Schließen"
          color="primary"
          @click="closeHtmlImportWithToast"
        />
        <template v-else>
          <UButton
            label="Abbrechen"
            color="neutral"
            variant="ghost"
            :disabled="importLoading"
            @click="cancelHtmlImport"
          />
          <UButton
            label="HTML-Datei wählen"
            color="primary"
            icon="i-lucide-file-input"
            :loading="importLoading"
            @click="handleConfirmHtmlImport"
          />
        </template>
      </div>
    </template>
  </UModal>

  <UModal v-model:open="importModalOpen" title="SQL-Backup importieren?">
    <template #body>
      <p class="text-sm text-muted">
        Die aktuelle Datenbank wird vollständig durch den Inhalt der SQL-Datei
        ersetzt. Erstelle vorher ein Backup, falls du die vorhandenen Lesezeichen
        behalten möchtest.
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <UButton
          label="Abbrechen"
          color="neutral"
          variant="ghost"
          :disabled="importLoading"
          @click="cancelImport"
        />
        <UButton
          label="SQL importieren"
          color="error"
          icon="i-lucide-upload"
          :loading="importLoading"
          @click="handleConfirmImport"
        />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="relocateModalOpen" title="Datenbank-Speicherort ändern">
    <template #body>
      <p class="text-sm text-muted">
        Die Datenbank wird unter folgendem Pfad abgelegt. Die App beendet den lokalen Dienst
        kurz und startet ihn am neuen Speicherort neu.
      </p>
      <UInput
        v-if="pendingTargetPath"
        :model-value="pendingTargetPath"
        readonly
        class="mt-3 w-full font-mono text-xs"
      />
      <p class="mt-3 text-sm text-muted">
        Existiert dort bereits eine gültige
        <code class="rounded bg-elevated px-1">bookmarks.db</code>,
        wird diese Datenbank verwendet (ohne Überschreibung).
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <UButton
          label="Abbrechen"
          color="neutral"
          variant="ghost"
          :disabled="relocateLoading"
          @click="cancelRelocate"
        />
        <UButton
          label="Speicherort übernehmen"
          color="primary"
          :loading="relocateLoading"
          @click="handleConfirmRelocate"
        />
      </div>
    </template>
  </UModal>
</template>
