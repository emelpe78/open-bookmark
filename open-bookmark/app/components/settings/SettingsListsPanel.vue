<script setup lang="ts">
import type { BookmarkListDetail, BookmarkListSummary } from "#shared/types/list";
import { extractFetchError } from "../../utils/extractFetchError";

const {
  lists,
  pending,
  error,
  fetchListDetail,
  deleteList,
} = useListAdmin();

const toast = useToast();

const expandedId = ref<number | null>(null);
const expandedDetail = ref<BookmarkListDetail | null>(null);
const detailPending = ref(false);

const deleteOpen = ref(false);
const deletingList = ref<BookmarkListSummary | null>(null);
const deleting = ref(false);

const editOpen = ref(false);
const editingList = ref<BookmarkListSummary | null>(null);

function openEdit(list: BookmarkListSummary): void {
  editingList.value = list;
  editOpen.value = true;
}

async function onListSaved(): Promise<void> {
  const id = editingList.value?.id;
  if (id && expandedId.value === id) {
    detailPending.value = true;
    try {
      const result = await fetchListDetail(id);
      expandedDetail.value = result.list;
    } catch {
      expandedId.value = null;
      expandedDetail.value = null;
    } finally {
      detailPending.value = false;
    }
  }
}

async function toggleExpand(list: BookmarkListSummary): Promise<void> {
  if (expandedId.value === list.id) {
    expandedId.value = null;
    expandedDetail.value = null;
    return;
  }

  expandedId.value = list.id;
  expandedDetail.value = null;
  detailPending.value = true;

  try {
    const result = await fetchListDetail(list.id);
    expandedDetail.value = result.list;
  } catch (error: unknown) {
    toast.add({
      title: "Liste konnte nicht geladen werden",
      description: extractFetchError(error, "Laden fehlgeschlagen"),
      color: "error",
    });
    expandedId.value = null;
  } finally {
    detailPending.value = false;
  }
}

function openDelete(list: BookmarkListSummary): void {
  deletingList.value = list;
  deleteOpen.value = true;
}

async function confirmDelete(): Promise<void> {
  if (!deletingList.value) {
    return;
  }

  deleting.value = true;
  try {
    await deleteList(deletingList.value.id);
    if (expandedId.value === deletingList.value.id) {
      expandedId.value = null;
      expandedDetail.value = null;
    }
    toast.add({ title: "Liste gelöscht", color: "success" });
    deleteOpen.value = false;
    deletingList.value = null;
  } catch (error: unknown) {
    toast.add({
      title: "Löschen fehlgeschlagen",
      description: extractFetchError(error, "Löschen fehlgeschlagen"),
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

function displayTitle(entry: { title: string | null; site_name: string | null; url: string }): string {
  return entry.title || entry.site_name || entry.url;
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">
      Listen gruppieren Lesezeichen — auf der Bookmarks-Seite anlegen, zu bestehenden Listen hinzufügen oder hier bearbeiten.
    </p>

    <div v-if="pending" class="space-y-2">
      <USkeleton v-for="n in 3" :key="n" class="h-14 rounded-lg" />
    </div>

    <div
      v-else-if="error"
      class="rounded-md border border-error/30 bg-error/10 p-4 text-sm text-error"
    >
      Listen konnten nicht geladen werden.
    </div>

    <UEmpty
      v-else-if="lists.length === 0"
      icon="i-lucide-list"
      title="Noch keine Listen"
      description="Wähle auf der Bookmarks-Seite Einträge aus und lege eine Liste an."
    />

    <ul v-else class="divide-y divide-default rounded-lg border border-default">
      <li
        v-for="list in lists"
        :key="list.id"
        class="bg-elevated/30"
      >
        <div class="flex items-center gap-2 p-3">
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-2 text-left"
            @click="toggleExpand(list)"
          >
            <UIcon
              :name="expandedId === list.id ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
              class="size-4 shrink-0 text-muted"
            />
            <span class="min-w-0 flex-1 font-medium">{{ list.name }}</span>
            <UBadge
              :label="String(list.count)"
              color="neutral"
              variant="subtle"
              size="xs"
            />
          </button>
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="sm"
            :aria-label="`Liste ${list.name} bearbeiten`"
            @click="openEdit(list)"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            :aria-label="`Liste ${list.name} löschen`"
            @click="openDelete(list)"
          />
        </div>

        <div
          v-if="expandedId === list.id"
          class="border-t border-default px-3 pb-3 pt-2"
        >
          <div v-if="detailPending" class="space-y-2 py-2">
            <USkeleton class="h-8 rounded-md" />
            <USkeleton class="h-8 rounded-md" />
          </div>
          <p
            v-else-if="
              !expandedDetail || expandedDetail.id !== list.id || !expandedDetail.bookmarks.length
            "
            class="py-2 text-sm text-muted"
          >
            Diese Liste enthält keine Lesezeichen.
          </p>
          <ul
            v-else-if="expandedDetail.id === list.id"
            class="space-y-1"
          >
            <li
              v-for="entry in expandedDetail.bookmarks"
              :key="entry.id"
            >
              <a
                :href="entry.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <UIcon name="i-lucide-external-link" class="size-3.5 shrink-0 text-muted" />
                <span class="min-w-0 truncate">{{ displayTitle(entry) }}</span>
              </a>
            </li>
          </ul>
        </div>
      </li>
    </ul>

    <SettingsListEditModal
      v-model:open="editOpen"
      :list="editingList"
      @saved="onListSaved"
    />

    <UModal v-model:open="deleteOpen" title="Liste löschen?">
      <template #body>
        <p class="text-sm text-muted">
          <template v-if="deletingList">
            Liste <strong class="text-default">{{ deletingList.name }}</strong>
            wirklich löschen? Die Lesezeichen selbst bleiben erhalten.
          </template>
        </p>
        <div class="mt-4 flex justify-end gap-2">
          <UButton
            label="Abbrechen"
            color="neutral"
            variant="outline"
            @click="deleteOpen = false"
          />
          <UButton
            label="Löschen"
            color="error"
            :loading="deleting"
            @click="confirmDelete"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
