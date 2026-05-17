<script setup lang="ts">
import { renderMarkdownHtml } from "../../lib/markdown";

const props = withDefaults(
  defineProps<{
    content?: string | null;
    clamp?: boolean;
    compact?: boolean;
  }>(),
  {
    content: null,
    clamp: false,
    compact: false,
  },
);

const html = computed(() => renderMarkdownHtml(props.content));
</script>

<template>
  <div
    v-if="html"
    class="markdown-content"
    :class="{ 'markdown-content--compact': compact, 'line-clamp-3': clamp }"
    v-html="html"
  />
</template>
