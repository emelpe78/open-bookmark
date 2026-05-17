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

const page = defineModel<number>("page", { required: true });
const pageSize = defineModel<number>("pageSize", { required: true });

const pageSizeSelectItems = [
  { label: "10 pro Seite", value: 10 },
  { label: "25 pro Seite", value: 25 },
  { label: "50 pro Seite", value: 50 },
  { label: "100 pro Seite", value: 100 },
];
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
