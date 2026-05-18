<script setup lang="ts">
import { extractFetchError } from "../utils/extractFetchError";

const open = defineModel<boolean>("open", { required: true });

const props = defineProps<{
  bookmarkCount: number;
  bookmarkIds: number[];
}>();

const emit = defineEmits<{
  created: [];
}>();

const { createList } = useListAdmin();
const toast = useToast();

const listName = ref("");
const saving = ref(false);

watch(open, (isOpen) => {
  if (isOpen) {
    listName.value = "";
  }
});

async function submit(): Promise<void> {
  const name = listName.value.trim();
  if (!name) {
    return;
  }

  const bookmarkIds = [...props.bookmarkIds];
  if (bookmarkIds.length === 0) {
    return;
  }

  saving.value = true;
  try {
    await createList(name, bookmarkIds);
    toast.add({
      title: "Liste erstellt",
      description: `„${name}“ mit ${bookmarkIds.length} Lesezeichen.`,
      color: "success",
    });
    open.value = false;
    emit("created");
  } catch (error: unknown) {
    toast.add({
      title: "Liste konnte nicht erstellt werden",
      description: extractFetchError(error, "Speichern fehlgeschlagen"),
      color: "error",
    });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Liste erstellen">
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">
          {{ bookmarkCount }}
          {{
            bookmarkCount === 1
              ? "Lesezeichen wird"
              : "Lesezeichen werden"
          }}
          der neuen Liste hinzugefügt.
        </p>
        <UFormField label="Listenname" required>
          <UInput
            v-model="listName"
            placeholder="z. B. Lesen, Arbeit, Inspiration"
            autocomplete="off"
            @keydown.enter.prevent="submit"
          />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <UButton
        label="Abbrechen"
        color="neutral"
        variant="outline"
        :disabled="saving"
        @click="open = false"
      />
      <UButton
        label="Liste speichern"
        icon="i-lucide-list"
        :loading="saving"
        :disabled="!listName.trim() || bookmarkCount === 0"
        @click="submit"
      />
    </template>
  </UModal>
</template>
