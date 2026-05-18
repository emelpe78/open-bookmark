<script setup lang="ts">
import {
  DESKTOP_BASE_URL,
  DESKTOP_LOCALHOST_URL,
} from "#shared/constants/desktop";

const open = defineModel<boolean>("open", { default: false });

const step = ref(0);
const { openExtensionFolder } = useDesktopBridge();

const steps = [
  {
    title: "Willkommen bei OpenBookmark",
    description:
      "Deine Lesezeichen bleiben lokal auf dem Mac — ohne Cloud und ohne Docker.",
  },
  {
    title: "Lokal als Desktop-App",
    description:
      "OpenBookmark startet den Dienst automatisch im Hintergrund. Die API läuft nur auf deinem Rechner.",
  },
  {
    title: "Basis-URL für die Extension",
    description: `Trage in den Extension-Einstellungen ein: ${DESKTOP_LOCALHOST_URL} (oder ${DESKTOP_BASE_URL}).`,
  },
  {
    title: "Browser-Erweiterung",
    description:
      "Lade die entpackte Extension aus dem dist-Ordner in Chrome. So speicherst du Seiten direkt aus dem Browser.",
  },
];

function finish() {
  if (import.meta.client) {
    localStorage.setItem("onboardingComplete", "1");
  }
  open.value = false;
}

function goToExtensionPage() {
  finish();
  navigateTo("/extension");
}
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'max-w-lg' }">
    <template #content>
      <div class="space-y-4 p-6">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-bookmark" class="size-6 text-primary" />
          <h2 class="text-lg font-semibold">
            {{ steps[step]?.title }}
          </h2>
        </div>
        <p class="text-sm text-muted">
          {{ steps[step]?.description }}
        </p>

        <ol
          v-if="step === steps.length - 1"
          class="list-decimal space-y-1 pl-5 text-sm text-muted"
        >
          <li>Chrome öffnen → <code class="text-default">chrome://extensions</code></li>
          <li>Entwicklermodus aktivieren</li>
          <li>„Entpackte Erweiterung laden“ → Ordner <code class="text-default">extension/dist</code></li>
        </ol>

        <div class="flex flex-wrap gap-2 pt-2">
          <UButton
            v-if="step > 0"
            label="Zurück"
            color="neutral"
            variant="outline"
            @click="step -= 1"
          />
          <UButton
            v-if="step < steps.length - 1"
            label="Weiter"
            @click="step += 1"
          />
          <UButton
            v-if="step === steps.length - 1"
            label="Extension einrichten"
            icon="i-lucide-puzzle"
            @click="goToExtensionPage"
          />
          <UButton
            label="Ohne Extension fortfahren"
            color="neutral"
            variant="ghost"
            @click="finish"
          />
          <UButton
            v-if="step === steps.length - 1"
            label="Ordner öffnen"
            icon="i-lucide-folder-open"
            color="neutral"
            variant="outline"
            @click="() => void openExtensionFolder()"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
