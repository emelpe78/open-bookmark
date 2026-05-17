<script setup lang="ts">
import type { Bookmark } from "../../shared/types/bookmark";
import { extractFetchError } from "../utils/extractFetchError";

useHead({
  title: "Open-Bookmark",
  meta: [
    {
      name: "description",
      content:
        "Lokale Lesezeichen-Verwaltung mit automatischen Metadaten, Markdown-Notizen, Tags und Suche.",
    },
  ],
});

const {
  page,
  bookmarks,
  total,
  pending,
  error,
  pageSize,
  deleteBookmark,
  refreshBookmarkMetadata,
} = useBookmarks();

const { openAdd: openAddModal } = useBookmarkModals();

const toast = useToast();

const pageCount = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize.value)),
);

async function handleRefresh(bookmark: Bookmark) {
  try {
    await refreshBookmarkMetadata(bookmark.id);
    toast.add({
      title: "Metadaten aktualisiert",
      description: bookmark.title ?? bookmark.url,
      color: "success",
    });
  } catch (error: unknown) {
    toast.add({
      title: "Aktualisierung fehlgeschlagen",
      description: extractFetchError(error, "Aktualisierung fehlgeschlagen"),
      color: "error",
    });
  }
}

async function handleDelete(bookmark: Bookmark) {
  try {
    await deleteBookmark(bookmark.id);
    toast.add({
      title: "Lesezeichen gelöscht",
      color: "success",
    });
  } catch (error: unknown) {
    toast.add({
      title: "Löschen fehlgeschlagen",
      description: extractFetchError(error, "Löschen fehlgeschlagen"),
      color: "error",
    });
  }
}

function openAddFromEmpty() {
  openAddModal();
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div v-if="error" class="rounded-md border border-error/30 bg-error/10 p-4 text-sm text-error">
      Lesezeichen konnten nicht geladen werden.
    </div>

    <div
      v-if="pending"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <USkeleton v-for="n in 8" :key="n" class="h-72 rounded-lg" />
    </div>

    <template v-else-if="bookmarks.length">
      <BookmarkListPagination
        v-model:page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-count="pageCount"
        placement="top"
      />

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <BookmarkCard
          v-for="bookmark in bookmarks"
          :key="bookmark.id"
          :bookmark="bookmark"
          @refresh="handleRefresh"
          @delete="handleDelete"
        />
      </div>

      <BookmarkListPagination
        v-model:page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-count="pageCount"
        placement="bottom"
      />
    </template>

    <UEmpty
      v-else
      icon="i-lucide-bookmark"
      title="Noch keine Lesezeichen"
      description="Füge dein erstes Lesezeichen hinzu — Metadaten werden automatisch geladen."
    >
      <UButton
        label="Lesezeichen hinzufügen"
        icon="i-lucide-plus"
        @click="openAddFromEmpty"
      />
    </UEmpty>
  </div>
</template>
