<script setup lang="ts">
useHead({
  title: "Einstellungen – Open Bookmark",
});

const activeTab = ref("general");

const tabItems = [
  { label: "Allgemein", value: "general", icon: "i-lucide-sliders-horizontal" },
  { label: "Tags", value: "tags", icon: "i-lucide-tags" },
  { label: "Listen", value: "lists", icon: "i-lucide-list" },
];
</script>

<template>
  <section class="mx-auto max-w-2xl space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Einstellungen
      </h1>
      <p class="mt-1 text-sm text-muted">
        App-Verhalten, Tags und Listen verwalten.
      </p>
    </div>

    <UCard>
      <UTabs v-model="activeTab" :items="tabItems" class="w-full">
        <template #content="{ item }">
          <div v-if="item.value === 'general'" class="space-y-4 pt-4">
            <SettingsThemeField />
            <SettingsDatabaseSection />
          </div>
          <SettingsTagsPanel v-else-if="item.value === 'tags'" class="pt-4" />
          <SettingsListsPanel v-else-if="item.value === 'lists'" class="pt-4" />
        </template>
      </UTabs>
    </UCard>
  </section>
</template>
