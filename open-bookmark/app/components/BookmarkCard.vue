<script setup lang="ts">
import type { Bookmark } from "#shared/types/bookmark";

const props = defineProps<{
  bookmark: Bookmark;
}>();

const emit = defineEmits<{
  edit: [bookmark: Bookmark];
  refresh: [bookmark: Bookmark];
  delete: [bookmark: Bookmark];
}>();

const { openEdit } = useBookmarkModals();

const displayTitle = computed(
  () => props.bookmark.title || props.bookmark.site_name || props.bookmark.url,
);

const displayHost = computed(() => {
  try {
    return new URL(props.bookmark.url).hostname;
  } catch {
    return props.bookmark.url;
  }
});

const {
  active: bulkActive,
  isSelected,
  toggleId,
  setIdSelection,
} = useBookmarkBulkSelection();

const deleteOpen = ref(false);
const refreshing = ref(false);

const selected = computed(() => isSelected(props.bookmark.id));

function onCardClick(event: MouseEvent): void {
  if (!bulkActive.value) {
    return;
  }
  const target = event.target as HTMLElement;
  if (target.closest("a, button, input, label")) {
    return;
  }
  toggleId(props.bookmark.id);
}

async function onRefresh() {
  refreshing.value = true;
  try {
    emit("refresh", props.bookmark);
  } finally {
    refreshing.value = false;
  }
}

function onEdit() {
  openEdit(props.bookmark);
  emit("edit", props.bookmark);
}

function confirmDelete() {
  emit("delete", props.bookmark);
  deleteOpen.value = false;
}
</script>

<template>
  <UCard
    class="flex h-full flex-col overflow-hidden transition-shadow"
    :class="[
      bulkActive && 'cursor-pointer',
      bulkActive && selected && 'ring-2 ring-primary',
    ]"
    @click="onCardClick"
  >
    <template #header>
      <div class="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
        <UCheckbox
          v-if="bulkActive"
          :model-value="selected"
          class="absolute top-2 right-2 z-10"
          :ui="{ base: 'bg-elevated/90 backdrop-blur' }"
          :aria-label="`Lesezeichen ${displayTitle} auswählen`"
          @click.stop
          @update:model-value="
            (value) => setIdSelection(bookmark.id, value === true)
          "
        />
        <img
          v-if="bookmark.image_url"
          :src="bookmark.image_url"
          :alt="displayTitle"
          loading="lazy"
          class="h-full w-full object-cover"
        >
        <div
          v-else
          class="flex h-full min-h-32 items-center justify-center text-muted"
        >
          <UIcon name="i-lucide-image" class="size-10 opacity-40" />
        </div>
      </div>
    </template>

    <div class="flex flex-1 flex-col gap-2">
      <div>
        <a
          :href="bookmark.url"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex items-start gap-1.5 font-semibold text-default hover:text-primary"
        >
          <span class="min-w-0 flex-1 line-clamp-2">{{ displayTitle }}</span>
          <UIcon
            name="i-lucide-external-link"
            class="mt-0.5 size-4 shrink-0 text-muted group-hover:text-primary"
            aria-hidden="true"
          />
        </a>
        <p class="mt-1 text-xs text-muted">
          {{ bookmark.site_name || displayHost }}
        </p>
      </div>

      <p v-if="bookmark.description" class="line-clamp-2 text-sm text-muted">
        {{ bookmark.description }}
      </p>

      <div v-if="bookmark.lists.length" class="flex flex-wrap gap-1">
        <UBadge
          v-for="listName in bookmark.lists"
          :key="`list-${listName}`"
          :label="listName"
          icon="i-lucide-list"
          color="info"
          variant="outline"
          size="xs"
        />
      </div>

      <div v-if="bookmark.tags.length" class="flex flex-wrap gap-1">
        <UBadge
          v-for="tagName in bookmark.tags"
          :key="`tag-${tagName}`"
          :label="tagName"
          color="primary"
          variant="subtle"
          size="xs"
        />
      </div>

      <MarkdownContent
        v-if="bookmark.notes"
        :content="bookmark.notes"
        compact
        clamp
        class="mt-1"
      />
    </div>

    <template v-if="!bulkActive" #footer>
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Bearbeiten"
          icon="i-lucide-pencil"
          color="neutral"
          variant="outline"
          size="sm"
          @click="onEdit"
        />
        <UButton
          label="Aktualisieren"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          size="sm"
          :loading="refreshing"
          @click="onRefresh"
        />
        <UButton
          label="Löschen"
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          @click="deleteOpen = true"
        />
      </div>
    </template>
  </UCard>

  <UModal v-model:open="deleteOpen" title="Lesezeichen löschen?">
    <template #body>
      <p class="text-sm text-muted">
        „{{ displayTitle }}“ wird dauerhaft entfernt.
      </p>
    </template>
    <template #footer>
      <UButton label="Abbrechen" color="neutral" variant="outline" @click="deleteOpen = false" />
      <UButton label="Löschen" color="error" @click="confirmDelete" />
    </template>
  </UModal>
</template>
