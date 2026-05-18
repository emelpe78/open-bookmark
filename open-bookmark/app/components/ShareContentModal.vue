<script setup lang="ts">
import type { ShareContent } from "#shared/lib/shareLinks";
import { buildMailtoUrl } from "#shared/lib/shareLinks";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  content: ShareContent | null;
}>();

const toast = useToast();
const copying = ref(false);

async function copyToClipboard(): Promise<void> {
  if (!props.content) {
    return;
  }

  copying.value = true;
  try {
    await navigator.clipboard.writeText(props.content.clipboardText);
    toast.add({
      title: "In Zwischenablage kopiert",
      color: "success",
    });
    open.value = false;
  } catch {
    toast.add({
      title: "Kopieren fehlgeschlagen",
      description: "Zwischenablage ist nicht verfügbar.",
      color: "error",
    });
  } finally {
    copying.value = false;
  }
}

function openEmailClient(): void {
  if (!props.content) {
    return;
  }

  const mailto = buildMailtoUrl(
    props.content.emailSubject,
    props.content.clipboardText,
  );
  window.location.href = mailto;
  open.value = false;
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="content?.modalTitle ?? 'Teilen'"
  >
    <template #body>
      <div v-if="content" class="flex flex-col gap-4">
        <p class="text-sm text-muted">
          Wähle, wie du den Inhalt teilen möchtest.
        </p>
        <pre
          class="max-h-40 overflow-y-auto rounded-md border border-default bg-muted/30 p-3 text-xs text-default whitespace-pre-wrap"
        >{{ content.clipboardText }}</pre>
        <ul class="flex flex-col gap-2">
          <li>
            <UButton
              :label="content.copyActionLabel"
              icon="i-lucide-copy"
              color="neutral"
              variant="outline"
              block
              :loading="copying"
              @click="copyToClipboard"
            />
          </li>
          <li>
            <UButton
              label="Per E-Mail senden"
              icon="i-lucide-mail"
              color="neutral"
              variant="outline"
              block
              @click="openEmailClient"
            />
          </li>
        </ul>
      </div>
    </template>
    <template #footer>
      <UButton
        label="Schließen"
        color="neutral"
        variant="ghost"
        @click="open = false"
      />
    </template>
  </UModal>
</template>
