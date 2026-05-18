<script setup lang="ts">
import { normalizeTagName } from "#shared/lib/normalizeTagName";

const model = defineModel<string>({ required: true });

const props = withDefaults(
  defineProps<{
    label?: string;
    hint?: string;
    placeholder?: string;
    error?: string;
  }>(),
  {
    label: "Name",
    hint: "Kleinbuchstaben, Wörter mit Bindestrich (z. B. open-source)",
    placeholder: "z. B. marc-lettau-poelchen",
    error: undefined,
  },
);

const { tagNames } = useTagSuggestions();

const searchTerm = ref("");

const items = computed(() => {
  const prefix = normalizeTagName(searchTerm.value);
  return tagNames.value
    .filter((name) => !prefix || name.startsWith(prefix))
    .map((name) => ({ label: name, value: name }));
});

watch(model, (value) => {
  searchTerm.value = value;
}, { immediate: true });

watch(searchTerm, (value) => {
  model.value = value;
});
</script>

<template>
  <UFormField :label="label" :description="hint" :error="error">
    <UInputMenu
      v-model="model"
      v-model:search-term="searchTerm"
      :items="items"
      value-key="value"
      :placeholder="placeholder"
      create-item
      class="w-full"
    />
  </UFormField>
</template>
