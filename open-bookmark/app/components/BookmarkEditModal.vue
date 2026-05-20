<script setup lang="ts">
import { extractFetchError } from "../utils/extractFetchError";
import { parseTagInput } from "../../../packages/tag-utils/src/parseTagInput";

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

async function submit() {
  const id = editingId.value;
  if (id == null) {
    fieldError.value = "Lesezeichen konnte nicht zugeordnet werden. Bitte erneut öffnen.";
    return;
  }

  fieldError.value = null;
  if (!url.value.trim()) {
    fieldError.value = "Bitte eine URL eingeben.";
    return;
  }

  const trimmedUrl = url.value.trim();
  const payload: {
    url?: string;
    notes: string | null;
    tags: string[];
  } = {
    notes: notes.value.trim() || null,
    tags: parseTagInput(tagsInput.value),
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
    fieldError.value = extractFetchError(error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Lesezeichen bearbeiten">
    <template #body>
      <div v-if="editingBookmark" class="flex w-full flex-col gap-4">
        <BookmarkFormFields
          v-model:url="url"
          v-model:tags-input="tagsInput"
          v-model:notes="notes"
          :field-error="fieldError"
          :notes-field-key="editingBookmark.id"
          notes-default-mode="preview"
        />

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
