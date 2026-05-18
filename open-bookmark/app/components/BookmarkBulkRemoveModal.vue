<script setup lang="ts">
const open = defineModel<boolean>("open", { required: true });

defineProps<{
  count: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
}>();
</script>

<template>
  <UModal v-model:open="open" title="Bookmarks entfernen?">
    <template #body>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-muted">
          Du löschst
          <strong class="text-default">{{ count }}</strong>
          {{ count === 1 ? "Lesezeichen" : "Lesezeichen" }}
          dauerhaft. Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Achtung"
          description="Metadaten, Tags und Notizen der ausgewählten Einträge gehen verloren."
        />
      </div>
    </template>
    <template #footer>
      <UButton
        label="Abbrechen"
        color="neutral"
        variant="outline"
        :disabled="loading"
        @click="open = false"
      />
      <UButton
        label="Entfernen"
        color="error"
        icon="i-lucide-trash-2"
        :loading="loading"
        @click="emit('confirm')"
      />
    </template>
  </UModal>
</template>
