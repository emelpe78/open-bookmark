<script setup lang="ts">
import type { BookmarkListEntry, BookmarkListSummary } from "#shared/types/list";
import { extractFetchError } from "../../utils/extractFetchError";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  list: BookmarkListSummary | null;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const { fetchListDetail, updateList } = useListAdmin();
const toast = useToast();

const listName = ref("");
const entries = ref<BookmarkListEntry[]>([]);
const loading = ref(false);
const saving = ref(false);
const fieldError = ref<string | null>(null);

watch([open, () => props.list], async ([isOpen, list]) => {
  if (!isOpen || !list) {
    return;
  }

  listName.value = list.name;
  entries.value = [];
  fieldError.value = null;
  loading.value = true;

  try {
    const result = await fetchListDetail(list.id);
    listName.value = result.list.name;
    entries.value = [...result.list.bookmarks];
  } catch (error: unknown) {
    fieldError.value = extractFetchError(error, "Liste konnte nicht geladen werden.");
  } finally {
    loading.value = false;
  }
});

function removeEntry(id: number): void {
  entries.value = entries.value.filter((entry) => entry.id !== id);
}

function displayTitle(entry: BookmarkListEntry): string {
  return entry.title || entry.site_name || entry.url;
}

async function submit(): Promise<void> {
  if (!props.list) {
    return;
  }

  const name = listName.value.trim();
  if (!name) {
    fieldError.value = "Listenname ist erforderlich.";
    return;
  }

  saving.value = true;
  fieldError.value = null;

  try {
    await updateList(props.list.id, {
      name,
      bookmarkIds: entries.value.map((entry) => entry.id),
    });
    toast.add({ title: "Liste gespeichert", color: "success" });
    open.value = false;
    emit("saved");
  } catch (error: unknown) {
    fieldError.value = extractFetchError(error, "Speichern fehlgeschlagen");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Liste bearbeiten">
    <template #body>
      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <UFormField label="Listenname" required :error="fieldError ?? undefined">
          <UInput
            v-model="listName"
            placeholder="Listenname"
            autocomplete="off"
            :disabled="loading || saving"
          />
        </UFormField>

        <div class="flex flex-col gap-2">
          <span class="text-sm font-medium text-default">Einträge</span>
          <div v-if="loading" class="space-y-2">
            <USkeleton class="h-9 rounded-md" />
            <USkeleton class="h-9 rounded-md" />
          </div>
          <p
            v-else-if="entries.length === 0"
            class="text-sm text-muted"
          >
            Diese Liste enthält keine Lesezeichen.
          </p>
          <ul
            v-else
            class="max-h-56 space-y-1 overflow-y-auto rounded-md border border-default p-1"
          >
            <li
              v-for="entry in entries"
              :key="entry.id"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
            >
              <span class="min-w-0 flex-1 truncate text-sm">
                {{ displayTitle(entry) }}
              </span>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                :aria-label="`${displayTitle(entry)} aus Liste entfernen`"
                :disabled="saving"
                @click="removeEntry(entry.id)"
              />
            </li>
          </ul>
          <p class="text-xs text-muted">
            Entfernte Einträge werden nur aus dieser Liste gelöscht, nicht aus deinen Lesezeichen.
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            label="Abbrechen"
            color="neutral"
            variant="outline"
            type="button"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            label="Speichern"
            type="submit"
            icon="i-lucide-save"
            :loading="saving"
            :disabled="loading || !listName.trim()"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
