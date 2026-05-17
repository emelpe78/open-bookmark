<script setup lang="ts">
withDefaults(
  defineProps<{
    total: number;
    pageCount: number;
    placement?: "top" | "bottom";
  }>(),
  {
    placement: "bottom",
  },
);

import { PAGE_SIZE_OPTIONS } from "../composables/useBookmarks";

const page = defineModel<number>("page", { required: true });
const pageSize = defineModel<number>("pageSize", { required: true });

const pageSizeSelectItems: Array<{ label: string; value: number }> =
  PAGE_SIZE_OPTIONS.map((size) => ({
    label: `${size} pro Seite`,
    value: size,
  }));
</script>

<template>
  <div
    class="flex flex-col items-center gap-4 border-default sm:flex-row sm:justify-between"
    :class="
      placement === 'top'
        ? 'border-b pb-4'
        : 'border-t pt-6'
    "
  >
    <USelect
      v-model="pageSize"
      :items="pageSizeSelectItems"
      class="w-full sm:w-44"
      aria-label="Einträge pro Seite"
    />
    <UPagination
      v-model:page="page"
      :total="total"
      :items-per-page="pageSize"
      :page-count="pageCount"
      show-edges
    />
  </div>
</template>
