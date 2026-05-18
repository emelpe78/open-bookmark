<script setup lang="ts">
import { extractFetchError } from "../utils/extractFetchError";

const {
  search,
  tag,
  tagOptions,
  bookmarks,
  deleteBookmarks,
} = useBookmarks();

const { openAdd } = useBookmarkModals();

const {
  active: bulkActive,
  selectedIds,
  selectedCount,
  confirmOpen,
  enter: enterBulkRemove,
  cancel: cancelBulkRemove,
  openConfirm,
  closeConfirm,
  setPageSelection,
  allOnPageSelected,
} = useBookmarkBulkRemove();

const toast = useToast();
const deleting = ref(false);

const pageIds = computed(() => bookmarks.value.map((bookmark) => bookmark.id));

const allPageSelected = computed(() => allOnPageSelected(pageIds.value));

async function confirmBulkDelete(): Promise<void> {
  const ids = [...selectedIds.value];
  if (ids.length === 0) {
    return;
  }

  deleting.value = true;
  try {
    await deleteBookmarks(ids);
    toast.add({
      title:
        ids.length === 1
          ? "Lesezeichen entfernt"
          : `${ids.length} Lesezeichen entfernt`,
      color: "success",
    });
    cancelBulkRemove();
  } catch (error: unknown) {
    toast.add({
      title: "Entfernen fehlgeschlagen",
      description: extractFetchError(error, "Entfernen fehlgeschlagen"),
      color: "error",
    });
  } finally {
    deleting.value = false;
    closeConfirm();
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Suchen…"
        class="w-full min-w-0 sm:flex-1"
        aria-label="Lesezeichen durchsuchen"
      />
      <USelectMenu
        v-model="tag"
        :items="tagOptions"
        value-key="value"
        placeholder="Alle Tags"
        class="w-full min-w-0 sm:flex-1"
        clear
      />
      <template v-if="!bulkActive">
        <UButton
          label="Hinzufügen"
          icon="i-lucide-plus"
          class="shrink-0"
          @click="openAdd"
        />
        <UButton
          label="Bookmarks entfernen"
          icon="i-lucide-trash-2"
          color="error"
          variant="outline"
          class="shrink-0"
          @click="enterBulkRemove"
        />
      </template>
      <template v-else>
        <UButton
          label="Abbrechen"
          color="neutral"
          variant="outline"
          class="shrink-0"
          @click="cancelBulkRemove"
        />
        <UButton
          :label="selectedCount > 0 ? `${selectedCount} ausgewählt` : 'Auswahl löschen'"
          icon="i-lucide-trash-2"
          color="error"
          class="shrink-0"
          :disabled="selectedCount === 0"
          @click="openConfirm"
        />
      </template>
    </div>

    <div
      v-if="bulkActive && bookmarks.length > 0"
      class="flex flex-wrap items-center gap-2 text-sm"
    >
      <UCheckbox
        :model-value="allPageSelected"
        label="Alle auf dieser Seite"
        @update:model-value="
          (value) => setPageSelection(pageIds, value === true)
        "
      />
      <span class="text-muted">
        Klicke auf Karten, um sie auszuwählen.
      </span>
    </div>

    <BookmarkBulkRemoveModal
      v-model:open="confirmOpen"
      :count="selectedCount"
      :loading="deleting"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>
