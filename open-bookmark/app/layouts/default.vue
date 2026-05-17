<script setup lang="ts">
const {
  search,
  tag,
  tagOptions,
} = useBookmarks();

const { openAdd, addOpen, editOpen } = useBookmarkModals();
</script>

<template>
  <div class="min-h-dvh bg-default text-default">
    <header class="sticky top-0 z-10 border-b border-default bg-default/95 backdrop-blur">
      <UContainer class="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-bookmark" class="size-7 text-primary" />
          <div>
            <h1 class="text-xl font-bold tracking-tight">
              Open-Bookmark
            </h1>
            <p class="text-xs text-muted">
              Lokale Lesezeichen mit Metadaten
            </p>
          </div>
        </div>

        <div class="flex flex-1 flex-col gap-2 sm:max-w-2xl sm:flex-row sm:items-center">
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
          <UButton
            label="Hinzufügen"
            icon="i-lucide-plus"
            class="shrink-0"
            @click="openAdd"
          />
        </div>
      </UContainer>
    </header>

    <main>
      <UContainer class="py-6">
        <slot />
      </UContainer>
    </main>

    <BookmarkAddModal v-model:open="addOpen" />
    <BookmarkEditModal v-model:open="editOpen" />
  </div>
</template>
