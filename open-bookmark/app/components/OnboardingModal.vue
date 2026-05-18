<script setup lang="ts">
import {
  DESKTOP_BASE_URL,
  DESKTOP_LOCALHOST_URL,
} from "#shared/constants/desktop";

const open = defineModel<boolean>("open", { default: false });

const step = ref(0);
const { openGitHubReleases } = useDesktopBridge();

const steps = [
  {
    title: "Willkommen bei Open Bookmark",
    description:
      "Deine Lesezeichen bleiben lokal auf dem Mac — ohne Cloud und ohne Docker.",
  },
  {
    title: "Lokal als Desktop-App",
    description:
      "Open Bookmark startet den Dienst automatisch im Hintergrund. Die API läuft nur auf deinem Rechner.",
  },
  {
    title: "Basis-URL für die Extension",
    description: `Trage in den Extension-Einstellungen ein: ${DESKTOP_LOCALHOST_URL} (oder ${DESKTOP_BASE_URL}).`,
  },
  {
    title: "Browser-Erweiterung",
    description:
      "Lade die Extension von GitHub Releases, entpacke sie z. B. nach ~/Applications/ und installiere sie in Chrome per Entwicklermodus.",
  },
];

const isLastStep = computed(() => step.value === steps.length - 1);

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
  <UModal
    v-model:open="open"
    :dismissible="false"
    :close="false"
    :ui="{ content: 'max-w-lg' }"
  >
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

        <ExtensionInstallSteps v-if="isLastStep" />

        <div class="flex flex-wrap gap-2 pt-2">
          <UButton
            v-if="step > 0"
            label="Zurück"
            color="neutral"
            variant="outline"
            @click="step -= 1"
          />
          <UButton
            v-if="!isLastStep"
            label="Weiter"
            @click="step += 1"
          />
          <template v-if="isLastStep">
            <UButton
              label="Extension einrichten"
              icon="i-lucide-puzzle"
              @click="goToExtensionPage"
            />
            <UButton
              label="Releases öffnen"
              icon="i-lucide-download"
              color="neutral"
              variant="outline"
              @click="openGitHubReleases"
            />
          </template>
        </div>
      </div>
    </template>
  </UModal>
</template>
