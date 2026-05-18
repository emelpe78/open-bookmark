<script setup lang="ts">
import type { TagWithCount } from "#shared/types/bookmark";
import { extractFetchError } from "../../utils/extractFetchError";

const {
  tags,
  pending,
  error,
  createTag,
  updateTag,
  deleteTag,
} = useTagAdmin();

const toast = useToast();

const editOpen = ref(false);
const editingTag = ref<TagWithCount | null>(null);
const deleteOpen = ref(false);
const deletingTag = ref<TagWithCount | null>(null);
const deleting = ref(false);

function openCreate(): void {
  editingTag.value = null;
  editOpen.value = true;
}

function openEdit(tag: TagWithCount): void {
  editingTag.value = tag;
  editOpen.value = true;
}

function openDelete(tag: TagWithCount): void {
  deletingTag.value = tag;
  deleteOpen.value = true;
}

async function handleSave(name: string): Promise<void> {
  if (editingTag.value) {
    await updateTag(editingTag.value.id, name);
    toast.add({ title: "Tag aktualisiert", color: "success" });
    return;
  }

  await createTag(name);
  toast.add({ title: "Tag erstellt", color: "success" });
}

async function confirmDelete(): Promise<void> {
  if (!deletingTag.value) {
    return;
  }

  deleting.value = true;
  try {
    await deleteTag(deletingTag.value.id);
    toast.add({ title: "Tag gelöscht", color: "success" });
    deleteOpen.value = false;
    deletingTag.value = null;
  } catch (error: unknown) {
    toast.add({
      title: "Löschen fehlgeschlagen",
      description: extractFetchError(error, "Löschen fehlgeschlagen"),
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm text-muted">
        Tags verwalten und Lesezeichen zuordnen.
      </p>
      <UButton
        label="Neuer Tag"
        icon="i-lucide-plus"
        @click="openCreate"
      />
    </div>

    <div
      v-if="error"
      class="rounded-md border border-error/30 bg-error/10 p-4 text-sm text-error"
    >
      Tags konnten nicht geladen werden.
    </div>

    <div v-else-if="pending" class="flex flex-wrap gap-2">
      <USkeleton v-for="n in 6" :key="n" class="h-8 w-24 rounded-full" />
    </div>

    <UEmpty
      v-else-if="!tags.length"
      icon="i-lucide-tags"
      title="Noch keine Tags"
      description="Lege deinen ersten Tag an — z. B. für Projekte oder Themen."
    >
      <UButton
        label="Tag erstellen"
        icon="i-lucide-plus"
        @click="openCreate"
      />
    </UEmpty>

    <ul
      v-else
      class="flex flex-wrap gap-2"
      role="list"
    >
      <li
        v-for="tag in tags"
        :key="tag.id"
        class="inline-flex items-center gap-1 rounded-full border border-default bg-elevated px-1 py-1 pl-3"
      >
        <span class="text-sm font-medium text-default">{{ tag.name }}</span>
        <UBadge
          color="neutral"
          variant="subtle"
          size="xs"
          class="tabular-nums"
        >
          {{ tag.count }}
        </UBadge>
        <UButton
          icon="i-lucide-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="`Tag ${tag.name} bearbeiten`"
          @click="openEdit(tag)"
        />
        <UButton
          icon="i-lucide-trash-2"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="`Tag ${tag.name} löschen`"
          @click="openDelete(tag)"
        />
      </li>
    </ul>

    <SettingsTagEditModal
      v-model:open="editOpen"
      :tag="editingTag"
      :save="handleSave"
    />

    <UModal v-model:open="deleteOpen" title="Tag löschen">
      <template #body>
        <p class="text-sm text-muted">
          <template v-if="deletingTag">
            Tag <strong class="text-default">{{ deletingTag.name }}</strong>
            wirklich löschen?
            <span v-if="deletingTag.count > 0">
              Er wird von {{ deletingTag.count }}
              Lesezeichen entfernt.
            </span>
          </template>
        </p>
        <div class="mt-4 flex justify-end gap-2">
          <UButton
            label="Abbrechen"
            color="neutral"
            variant="outline"
            @click="deleteOpen = false"
          />
          <UButton
            label="Löschen"
            color="error"
            :loading="deleting"
            @click="confirmDelete"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
