<script setup lang="ts">
import { extractFetchError } from "../utils/extractFetchError";

const {
  search,
  tag,
  list,
  tagOptions,
  hasTags,
  listOptions,
  listPickerOptions,
  hasLists,
  bookmarks,
  deleteBookmarks,
} = useBookmarks();

const { openAdd } = useBookmarkModals();

const {
  active: bulkActive,
  isRemoveMode,
  isListCreateMode,
  isListAddMode,
  selectedIds,
  selectedCount,
  removeConfirmOpen,
  listCreateDialogOpen,
  listAddDialogOpen,
  enter,
  cancel,
  openRemoveConfirm,
  closeRemoveConfirm,
  openListCreateDialog,
  openListAddDialog,
  setPageSelection,
  allOnPageSelected,
} = useBookmarkBulkSelection();

const toast = useToast();
const deleting = ref(false);

const pageIds = computed(() => bookmarks.value.map((bookmark) => bookmark.id));

const allPageSelected = computed(() => allOnPageSelected(pageIds.value));

const listSelectionHint = computed(() => {
  if (isListAddMode.value) {
    return "Klicke auf Karten, um sie einer bestehenden Liste hinzuzufügen.";
  }
  if (isListCreateMode.value) {
    return "Klicke auf Karten für die neue Liste.";
  }
  return "Klicke auf Karten, um sie auszuwählen.";
});

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
    cancel();
  } catch (error: unknown) {
    toast.add({
      title: "Entfernen fehlgeschlagen",
      description: extractFetchError(error, "Entfernen fehlgeschlagen"),
      color: "error",
    });
  } finally {
    deleting.value = false;
    closeRemoveConfirm();
  }
}

function onListActionDone(): void {
  cancel();
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:flex-wrap">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Suchen…"
        class="w-full min-w-0 lg:flex-1"
        aria-label="Lesezeichen durchsuchen"
      />
      <USelectMenu
        v-if="hasTags"
        v-model="tag"
        :items="tagOptions"
        value-key="value"
        placeholder="Alle Tags"
        class="w-full min-w-0 lg:flex-1"
        clear
        aria-label="Nach Tag filtern"
      />
      <USelectMenu
        v-if="hasLists"
        v-model="list"
        :items="listOptions"
        value-key="value"
        placeholder="Alle Listen"
        class="w-full min-w-0 lg:flex-1"
        clear
        aria-label="Nach Liste filtern"
      />
      <template v-if="!bulkActive">
        <UButton
          label="Hinzufügen"
          icon="i-lucide-plus"
          class="shrink-0"
          @click="openAdd"
        />
        <UButton
          v-if="hasLists"
          label="Zu Liste hinzufügen"
          icon="i-lucide-list-plus"
          color="neutral"
          variant="outline"
          class="shrink-0"
          @click="enter('list-add')"
        />
        <UButton
          label="Liste erstellen"
          icon="i-lucide-list"
          color="neutral"
          variant="outline"
          class="shrink-0"
          @click="enter('list-create')"
        />
        <UButton
          label="Bookmarks entfernen"
          icon="i-lucide-trash-2"
          color="error"
          variant="outline"
          class="shrink-0"
          @click="enter('remove')"
        />
      </template>
      <template v-else-if="isListAddMode">
        <UButton
          label="Abbrechen"
          color="neutral"
          variant="outline"
          class="shrink-0"
          @click="cancel"
        />
        <UButton
          :label="
            selectedCount > 0
              ? `Hinzufügen (${selectedCount})`
              : 'Hinzufügen'
          "
          icon="i-lucide-list-plus"
          class="shrink-0"
          :disabled="selectedCount === 0"
          @click="openListAddDialog"
        />
      </template>
      <template v-else-if="isListCreateMode">
        <UButton
          label="Abbrechen"
          color="neutral"
          variant="outline"
          class="shrink-0"
          @click="cancel"
        />
        <UButton
          :label="
            selectedCount > 0
              ? `Liste speichern (${selectedCount})`
              : 'Liste speichern'
          "
          icon="i-lucide-list"
          class="shrink-0"
          :disabled="selectedCount === 0"
          @click="openListCreateDialog"
        />
      </template>
      <template v-else-if="isRemoveMode">
        <UButton
          label="Abbrechen"
          color="neutral"
          variant="outline"
          class="shrink-0"
          @click="cancel"
        />
        <UButton
          :label="selectedCount > 0 ? `${selectedCount} ausgewählt` : 'Auswahl löschen'"
          icon="i-lucide-trash-2"
          color="error"
          class="shrink-0"
          :disabled="selectedCount === 0"
          @click="openRemoveConfirm"
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
        {{ listSelectionHint }}
      </span>
    </div>

    <BookmarkBulkRemoveModal
      v-model:open="removeConfirmOpen"
      :count="selectedCount"
      :loading="deleting"
      @confirm="confirmBulkDelete"
    />

    <BookmarkCreateListModal
      v-model:open="listCreateDialogOpen"
      :bookmark-count="selectedCount"
      :bookmark-ids="selectedIds"
      @created="onListActionDone"
    />

    <BookmarkAddToListModal
      v-model:open="listAddDialogOpen"
      :bookmark-count="selectedCount"
      :bookmark-ids="selectedIds"
      :list-picker-options="listPickerOptions"
      @added="onListActionDone"
    />
  </div>
</template>
