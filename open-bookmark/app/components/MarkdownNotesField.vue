<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    defaultMode?: "edit" | "preview";
  }>(),
  {
    defaultMode: "edit",
  },
);

const model = defineModel<string>({ default: "" });

const mode = ref<"edit" | "preview">(props.defaultMode);

const modeItems = [
  { label: "Bearbeiten", value: "edit" },
  { label: "Vorschau", value: "preview" },
];

watch(
  () => props.defaultMode,
  (value) => {
    mode.value = value;
  },
);
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <UTabs v-model="mode" :items="modeItems" size="xs" class="w-fit" />

    <UTextarea
      v-if="mode === 'edit'"
      v-model="model"
      :rows="6"
      placeholder="Notizen in Markdown…"
      autoresize
    />

    <div
      v-else
      class="min-h-32 rounded-md border border-default bg-elevated/50 p-4"
    >
      <MarkdownContent v-if="model.trim()" :content="model" />
      <p v-else class="text-sm text-muted">
        Keine Notizen vorhanden.
      </p>
    </div>
  </div>
</template>
