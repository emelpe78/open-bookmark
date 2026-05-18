<script setup lang="ts">
import type { TagWithCount } from "#shared/types/bookmark";
import { extractFetchError } from "../../utils/extractFetchError";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  tag: TagWithCount | null;
  save: (name: string) => Promise<void>;
}>();

const name = ref("");
const fieldError = ref<string | null>(null);
const submitting = ref(false);

const isCreate = computed(() => !props.tag);

watch([open, () => props.tag], ([isOpen, tag]) => {
  if (isOpen) {
    name.value = tag?.name ?? "";
    fieldError.value = null;
    submitting.value = false;
  }
});

async function submit(): Promise<void> {
  fieldError.value = null;
  const trimmed = name.value.trim();
  if (!trimmed) {
    fieldError.value = "Tag-Name ist erforderlich.";
    return;
  }

  submitting.value = true;
  try {
    await props.save(trimmed);
    open.value = false;
  } catch (error: unknown) {
    fieldError.value = extractFetchError(error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="isCreate ? 'Tag erstellen' : 'Tag bearbeiten'"
  >
    <template #body>
      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <TagNameInput
          v-model="name"
          :error="fieldError ?? undefined"
        />

        <div class="flex justify-end gap-2">
          <UButton
            label="Abbrechen"
            color="neutral"
            variant="outline"
            type="button"
            @click="open = false"
          />
          <UButton
            :label="isCreate ? 'Erstellen' : 'Speichern'"
            type="submit"
            :loading="submitting"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
