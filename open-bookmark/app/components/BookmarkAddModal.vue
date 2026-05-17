<script setup lang="ts">
import type { BulkImportResult } from "../../shared/types/bookmark";

const open = defineModel<boolean>("open", { default: false });

const {
  createBookmark,
  bulkImport,
} = useBookmarks();

const activeTab = ref("single");
const tabItems = [
  { label: "Einzeln", value: "single" },
  { label: "Liste", value: "bulk" },
];

const url = ref("");
const bulkUrls = ref("");
const notes = ref("");
const tagsInput = ref("");
const submitting = ref(false);
const fieldError = ref<string | null>(null);
const bulkSummary = ref<BulkImportResult | null>(null);

function resetForm() {
  activeTab.value = "single";
  url.value = "";
  bulkUrls.value = "";
  notes.value = "";
  tagsInput.value = "";
  fieldError.value = null;
  bulkSummary.value = null;
}

watch(open, (isOpen) => {
  if (isOpen) {
    resetForm();
  }
});

function parseTags(): string[] {
  return tagsInput.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function submitSingle() {
  fieldError.value = null;
  if (!url.value.trim()) {
    fieldError.value = "Bitte eine URL eingeben.";
    return;
  }

  submitting.value = true;
  try {
    await createBookmark({
      url: url.value.trim(),
      notes: notes.value.trim() || null,
      tags: parseTags(),
    });
    open.value = false;
  } catch (error: unknown) {
    fieldError.value = extractErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function submitBulk() {
  fieldError.value = null;
  if (!bulkUrls.value.trim()) {
    fieldError.value = "Bitte mindestens eine URL eingeben.";
    return;
  }

  submitting.value = true;
  try {
    bulkSummary.value = await bulkImport(bulkUrls.value.trim());
  } catch (error: unknown) {
    fieldError.value = extractErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { statusMessage?: string } }).data;
    if (data?.statusMessage) {
      return data.statusMessage;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Speichern fehlgeschlagen.";
}
</script>

<template>
  <UModal v-model:open="open" title="Lesezeichen hinzufügen">
    <template #body>
      <UTabs v-model="activeTab" :items="tabItems" class="mb-4 w-full">
        <template #content="{ item }">
          <div v-if="item.value === 'single'" class="flex w-full flex-col gap-4 pt-2">
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
              <MarkdownNotesField v-model="notes" />
            </UFormField>

            <UButton
              label="Speichern"
              icon="i-lucide-plus"
              :loading="submitting"
              block
              @click="submitSingle"
            />
          </div>

          <div v-else class="flex w-full flex-col gap-4 pt-2">
            <UFormField
              label="URLs (kommagetrennt)"
              required
              :error="fieldError ?? undefined"
            >
              <UTextarea
                v-model="bulkUrls"
                :rows="5"
                placeholder="https://a.com, https://b.com"
                autoresize
              />
            </UFormField>

            <UButton
              label="Importieren"
              icon="i-lucide-list-plus"
              :loading="submitting"
              block
              @click="submitBulk"
            />

            <div v-if="bulkSummary" class="flex flex-col gap-3 rounded-md border border-default p-3">
              <p class="text-sm font-medium text-default">
                Import abgeschlossen
              </p>
              <div class="flex flex-wrap gap-2">
                <UBadge color="success" variant="subtle">
                  {{ bulkSummary.created }} angelegt
                </UBadge>
                <UBadge color="warning" variant="subtle">
                  {{ bulkSummary.skipped }} übersprungen
                </UBadge>
                <UBadge
                  v-if="bulkSummary.failed.length"
                  color="error"
                  variant="subtle"
                >
                  {{ bulkSummary.failed.length }} fehlgeschlagen
                </UBadge>
              </div>
              <ul
                v-if="bulkSummary.failed.length"
                class="max-h-32 space-y-1 overflow-y-auto text-xs text-muted"
              >
                <li v-for="entry in bulkSummary.failed" :key="entry.url">
                  <span class="font-medium text-default">{{ entry.url }}</span>
                  — {{ entry.reason }}
                </li>
              </ul>
              <UButton
                label="Schließen"
                color="neutral"
                variant="outline"
                block
                @click="open = false"
              />
            </div>
          </div>
        </template>
      </UTabs>
    </template>
  </UModal>
</template>
