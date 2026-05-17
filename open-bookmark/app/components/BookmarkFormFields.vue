<script setup lang="ts">
withDefaults(
  defineProps<{
    fieldError?: string | null;
    notesDefaultMode?: "edit" | "preview";
    notesFieldKey?: string | number;
  }>(),
  {
    fieldError: null,
    notesDefaultMode: "edit",
    notesFieldKey: undefined,
  },
);

const url = defineModel<string>("url", { required: true });
const tagsInput = defineModel<string>("tagsInput", { required: true });
const notes = defineModel<string>("notes", { required: true });
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <UFormField label="URL" required :error="fieldError ?? undefined">
      <UInput
        v-model="url"
        type="url"
        placeholder="https://example.com"
        autocomplete="url"
      />
    </UFormField>

    <UFormField label="Tags" hint="Kommagetrennt">
      <UInput v-model="tagsInput" placeholder="nuxt, docs, lesen" />
    </UFormField>

    <UFormField label="Notizen">
      <MarkdownNotesField
        :key="notesFieldKey"
        v-model="notes"
        :default-mode="notesDefaultMode"
      />
    </UFormField>
  </div>
</template>
