<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const { editingBookmark, editingId, closeEdit } = useBookmarkModals();
const { updateBookmark } = useBookmarks();

const url = ref("");
const originalUrl = ref("");
const notes = ref("");
const tagsInput = ref("");
const submitting = ref(false);
const fieldError = ref<string | null>(null);

watch(
  [open, editingBookmark],
  ([isOpen, bookmark]) => {
    if (isOpen && bookmark) {
      url.value = bookmark.url;
      originalUrl.value = bookmark.url;
      notes.value = bookmark.notes ?? "";
      tagsInput.value = bookmark.tags.join(", ");
      fieldError.value = null;
    }
  },
  { immediate: true },
);

function parseTags(): string[] {
  return tagsInput.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function submit() {
  const id = editingId.value;
  if (id == null) {
    fieldError.value = "Lesezeichen konnte nicht zugeordnet werden. Bitte erneut öffnen.";
    return;
  }

  fieldError.value = null;
  const trimmedUrl = url.value.trim();
  if (!trimmedUrl) {
    fieldError.value = "Bitte eine URL eingeben.";
    return;
  }

  const payload: {
    url?: string;
    notes: string | null;
    tags: string[];
  } = {
    notes: notes.value.trim() || null,
    tags: parseTags(),
  };

  if (trimmedUrl !== originalUrl.value.trim()) {
    payload.url = trimmedUrl;
  }

  submitting.value = true;
  try {
    await updateBookmark(id, payload);
    closeEdit();
    open.value = false;
  } catch (error: unknown) {
    fieldError.value = extractErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const fetchError = error as {
      data?: { statusMessage?: string; message?: string };
      statusMessage?: string;
    };
    if (fetchError.data?.statusMessage) {
      return fetchError.data.statusMessage;
    }
    if (fetchError.data?.message) {
      return fetchError.data.message;
    }
    if (fetchError.statusMessage) {
      return fetchError.statusMessage;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Speichern fehlgeschlagen.";
}
</script>

<template>
  <UModal v-model:open="open" title="Lesezeichen bearbeiten">
    <template #body>
      <div v-if="editingBookmark" class="flex w-full flex-col gap-4">
        <UFormField label="URL" required :error="fieldError ?? undefined">
          <UInput
            v-model="url"
            type="url"
            placeholder="https://example.com"
            autocomplete="url"
          />
        </UFormField>

        <UFormField label="Tags" hint="Kommagetrennt">
          <UInput v-model="tagsInput" placeholder="nuxt, docs, lesen" />
        </UFormField>

        <UFormField label="Notizen">
          <MarkdownNotesField
            :key="editingBookmark.id"
            v-model="notes"
            default-mode="preview"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="Abbrechen"
            color="neutral"
            variant="outline"
            @click="closeEdit(); open = false"
          />
          <UButton
            label="Speichern"
            icon="i-lucide-check"
            :loading="submitting"
            @click="submit"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
