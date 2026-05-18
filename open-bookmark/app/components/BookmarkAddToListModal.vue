<script setup lang="ts">
import { extractFetchError } from "../utils/extractFetchError";

const open = defineModel<boolean>("open", { required: true });

const props = defineProps<{
  bookmarkCount: number;
  bookmarkIds: number[];
  listPickerOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  added: [];
}>();

const { addBookmarksToList } = useListAdmin();
const toast = useToast();

const selectedListId = ref<unknown>(undefined);
const saving = ref(false);

watch(open, (isOpen) => {
  if (isOpen) {
    selectedListId.value = undefined;
  }
});

function parseListId(raw: unknown): number | null {
  let value: string | undefined;
  if (typeof raw === "string" || typeof raw === "number") {
    value = String(raw);
  } else if (raw && typeof raw === "object" && "value" in raw) {
    value = String((raw as { value: string }).value);
  }
  if (!value) {
    return null;
  }
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function submit(): Promise<void> {
  const listId = parseListId(selectedListId.value);
  if (listId === null || props.bookmarkIds.length === 0) {
    return;
  }

  saving.value = true;
  try {
    const result = await addBookmarksToList(listId, [...props.bookmarkIds]);
    toast.add({
      title: "Zur Liste hinzugefügt",
      description: `${props.bookmarkCount} Lesezeichen in „${result.name}".`,
      color: "success",
    });
    open.value = false;
    emit("added");
  } catch (error: unknown) {
    toast.add({
      title: "Hinzufügen fehlgeschlagen",
      description: extractFetchError(error, "Hinzufügen fehlgeschlagen"),
      color: "error",
    });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Zu Liste hinzufügen">
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">
          {{ bookmarkCount }}
          {{
            bookmarkCount === 1
              ? "Lesezeichen wird"
              : "Lesezeichen werden"
          }}
          der ausgewählten Liste hinzugefügt (bereits enthaltene werden übersprungen).
        </p>
        <UFormField label="Liste" required>
          <USelectMenu
            v-model="selectedListId"
            :items="listPickerOptions"
            value-key="value"
            placeholder="Liste auswählen…"
            class="w-full"
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
        label="Hinzufügen"
        icon="i-lucide-list-plus"
        :loading="saving"
        :disabled="parseListId(selectedListId) === null || bookmarkCount === 0"
        @click="submit"
      />
    </template>
  </UModal>
</template>
