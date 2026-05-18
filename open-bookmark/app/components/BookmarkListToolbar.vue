<script setup lang="ts">
const {
  search,
  tag,
  tagOptions,
} = useBookmarks();

const { openAdd } = useBookmarkModals();
</script>

<template>
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
    <UButton
      label="Hinzufügen"
      icon="i-lucide-plus"
      class="shrink-0"
      @click="openAdd"
    />
  </div>
</template>
