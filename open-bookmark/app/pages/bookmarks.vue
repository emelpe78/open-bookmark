<script setup lang="ts">
import type { Bookmark } from "#shared/types/bookmark";
import { extractFetchError } from "../utils/extractFetchError";

useHead({
  title: "Bookmarks – Open Bookmark",
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

/** Leere Liste (inkl. erstem Laden) — zentrierter Bereich unter der Toolbar. */
const showCenteredEmpty = computed(
  () => !error.value && bookmarks.value.length === 0,
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
    <BookmarkListToolbar />

    <div v-if="error" class="rounded-md border border-error/30 bg-error/10 p-4 text-sm text-error">
      Lesezeichen konnten nicht geladen werden.
    </div>

    <template v-else-if="bookmarks.length && !pending">
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

    <div
      v-else-if="showCenteredEmpty"
      class="relative w-full min-h-[min(28rem,calc(100dvh-13rem))]"
    >
      <div class="absolute inset-0 flex items-center justify-center px-4 py-8">
        <UEmpty
          v-if="!pending"
          icon="i-lucide-bookmark"
          title="Noch keine Lesezeichen"
          description="Füge dein erstes Lesezeichen hinzu — Metadaten werden automatisch geladen."
          class="w-full max-w-md"
        >
          <UButton
            label="Lesezeichen hinzufügen"
            icon="i-lucide-plus"
            @click="openAddFromEmpty"
          />
        </UEmpty>
        <div
          v-else
          class="flex flex-col items-center gap-3 text-muted"
          aria-busy="true"
          aria-label="Lesezeichen werden geladen"
        >
          <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin" />
          <p class="text-sm">
            Lesezeichen werden geladen …
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
