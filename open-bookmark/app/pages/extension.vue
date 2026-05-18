<script setup lang="ts">
import {
  DESKTOP_BASE_URL,
  DESKTOP_LOCALHOST_URL,
} from "#shared/constants/desktop";

const config = useRuntimeConfig();
const baseUrl = computed(
  () => config.public.appPort
    ? `http://127.0.0.1:${config.public.appPort}`
    : DESKTOP_BASE_URL,
);
const copyUrl = DESKTOP_LOCALHOST_URL;

const { isElectron, openExtensionFolder } = useDesktopBridge();

type ConnectionState = "loading" | "ok" | "error";

const connectionState = ref<ConnectionState>("loading");
const connectionMessage = ref("");
const copyDone = ref(false);

async function refreshConnection(): Promise<void> {
  connectionState.value = "loading";
  connectionMessage.value = "";
  try {
    const tags = await $fetch<Array<{ name: string }>>("/api/tags");
    const count = tags.length;
    const label = count === 1 ? "Tag" : "Tags";
    connectionState.value = "ok";
    connectionMessage.value = `Lokaler Dienst erreichbar (${count} ${label}).`;
  } catch {
    connectionState.value = "error";
    connectionMessage.value =
      "Der lokale Dienst ist nicht erreichbar. Starte OpenBookmark Desktop oder prüfe Port 3777.";
  }
}

async function copyBaseUrl(): Promise<void> {
  await navigator.clipboard.writeText(copyUrl);
  copyDone.value = true;
  setTimeout(() => {
    copyDone.value = false;
  }, 2000);
}

onMounted(() => {
  void refreshConnection();
});
</script>

<template>
  <section class="mx-auto max-w-2xl space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Browser-Erweiterung
      </h1>
      <p class="mt-1 text-sm text-muted">
        Speichere Seiten direkt aus Chrome oder Chromium in OpenBookmark.
      </p>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-activity" class="size-5" />
          <span class="font-semibold">Status</span>
        </div>
      </template>

      <div class="space-y-3">
        <UAlert
          v-if="connectionState === 'loading'"
          color="neutral"
          variant="subtle"
          title="Verbindung wird geprüft…"
        />
        <UAlert
          v-else-if="connectionState === 'ok'"
          color="success"
          variant="subtle"
          :title="connectionMessage"
        />
        <UAlert
          v-else
          color="warning"
          variant="subtle"
          title="Nicht erreichbar"
          :description="connectionMessage"
        />

        <div class="space-y-1 text-sm">
          <p class="text-muted">
            Basis-URL für die Extension:
          </p>
          <p class="font-mono text-default">
            {{ copyUrl }}
          </p>
          <p class="text-xs text-muted">
            Alternativ: {{ baseUrl }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            :label="copyDone ? 'Kopiert' : 'Basis-URL kopieren'"
            icon="i-lucide-copy"
            @click="copyBaseUrl"
          />
          <UButton
            label="Status aktualisieren"
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            @click="refreshConnection"
          />
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-puzzle" class="size-5" />
          <span class="font-semibold">Installation (Side-Load)</span>
        </div>
      </template>

      <ol class="list-decimal space-y-2 pl-5 text-sm text-muted">
        <li>Extension bauen: <code class="text-default">cd extension && npm run build</code></li>
        <li>Chrome öffnen: <code class="text-default">chrome://extensions</code></li>
        <li><strong>Entwicklermodus</strong> aktivieren</li>
        <li><strong>Entpackte Erweiterung laden</strong> → Ordner <code class="text-default">extension/dist</code></li>
        <li>In den Extension-Einstellungen die Basis-URL <code class="text-default">{{ copyUrl }}</code> eintragen</li>
        <li>Host-Zugriff bestätigen, wenn Chrome danach fragt</li>
      </ol>

      <div class="mt-4 flex flex-wrap gap-2">
        <UButton
          v-if="isElectron"
          label="Extension-Ordner öffnen"
          icon="i-lucide-folder-open"
          @click="() => void openExtensionFolder()"
        />
        <UButton
          label="Zur Startseite"
          color="neutral"
          variant="outline"
          to="/"
        />
      </div>

      <p v-if="!isElectron" class="mt-3 text-xs text-muted">
        Im Browser-Dev-Modus liegt der Ordner im Repository unter
        <code class="text-default">extension/dist</code>.
      </p>
    </UCard>
  </section>
</template>
