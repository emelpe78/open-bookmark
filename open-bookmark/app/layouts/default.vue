<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();

const { addOpen, editOpen } = useBookmarkModals();

const navItems = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: "Bookmarks",
      to: "/bookmarks",
      icon: "i-lucide-bookmark",
      active: route.path === "/bookmarks",
    },
    {
      label: "Extension",
      to: "/extension",
      icon: "i-lucide-puzzle",
      active: route.path === "/extension",
    },
    {
      label: "Einstellungen",
      to: "/settings",
      icon: "i-lucide-settings",
      active: route.path === "/settings",
    },
  ],
]);
</script>

<template>
  <div class="min-h-dvh bg-default text-default">
    <header class="sticky top-0 z-10 border-b border-default bg-default/95 backdrop-blur">
      <UContainer class="flex items-center justify-between gap-4 py-4">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-bookmark" class="size-7 text-primary" />
          <div>
            <h1 class="text-xl font-bold tracking-tight">
              Open Bookmark
            </h1>
            <p class="text-xs text-muted">
              Lokale Lesezeichen mit Metadaten
            </p>
          </div>
        </div>

        <UNavigationMenu :items="navItems" class="shrink-0" />
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
