<script setup lang="ts">
import {
  applyTagSuggestion,
  filterTagSuggestions,
  getTagInputState,
} from "#shared/lib/tagInputComposer";

const model = defineModel<string>({ required: true });

withDefaults(
  defineProps<{
    placeholder?: string;
    description?: string;
  }>(),
  {
    placeholder: "nuxt, open-source, lesen",
    description:
      "Kommagetrennt; wird als Kleinbuchstaben mit Bindestrichen gespeichert",
  },
);

const { tagNames } = useTagSuggestions();

const inputRef = ref<{ inputRef?: HTMLInputElement; $el?: HTMLElement } | null>(
  null,
);
const listRef = ref<HTMLElement | null>(null);
const suggestionsOpen = ref(false);
const inputFocused = ref(false);
const highlightedIndex = ref(0);

const cursorPos = ref(0);

const inputState = computed(() =>
  getTagInputState(model.value, cursorPos.value),
);

const suggestions = computed(() =>
  filterTagSuggestions(tagNames.value, inputState.value),
);

const hasSuggestions = computed(
  () => suggestionsOpen.value && suggestions.value.length > 0,
);

watch(
  () => inputState.value.fragmentNormalized,
  () => {
    highlightedIndex.value = 0;
  },
);

watch(highlightedIndex, () => {
  nextTick(() => {
    const item = listRef.value?.children[highlightedIndex.value] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView({ block: "nearest" });
  });
});

function getNativeInput(): HTMLInputElement | null {
  const root = inputRef.value;
  if (!root) {
    return null;
  }
  if (root.inputRef instanceof HTMLInputElement) {
    return root.inputRef;
  }
  return root.$el?.querySelector("input") ?? null;
}

function syncCursor(): void {
  const el = getNativeInput();
  if (el) {
    cursorPos.value = el.selectionStart ?? model.value.length;
  }
}

function updateSuggestions(): void {
  syncCursor();
  if (inputFocused.value) {
    suggestionsOpen.value = suggestions.value.length > 0;
  }
}

function onFocus(): void {
  inputFocused.value = true;
  syncCursor();
  suggestionsOpen.value = suggestions.value.length > 0;
}

function closeSuggestionsSoon(): void {
  window.setTimeout(() => {
    inputFocused.value = false;
    suggestionsOpen.value = false;
  }, 150);
}

function selectSuggestion(tagName: string): void {
  syncCursor();
  const { value, cursorPos: nextPos } = applyTagSuggestion(
    model.value,
    tagName,
    cursorPos.value,
  );
  model.value = value;
  cursorPos.value = nextPos;
  suggestionsOpen.value = false;

  nextTick(() => {
    const el = getNativeInput();
    el?.focus();
    el?.setSelectionRange(nextPos, nextPos);
  });
}

function onKeydown(event: KeyboardEvent): void {
  if (!inputFocused.value || suggestions.value.length === 0) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    event.stopPropagation();
    if (!suggestionsOpen.value) {
      suggestionsOpen.value = true;
      highlightedIndex.value = 0;
      return;
    }
    highlightedIndex.value =
      (highlightedIndex.value + 1) % suggestions.value.length;
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    event.stopPropagation();
    if (!suggestionsOpen.value) {
      suggestionsOpen.value = true;
      highlightedIndex.value = suggestions.value.length - 1;
      return;
    }
    highlightedIndex.value =
      (highlightedIndex.value - 1 + suggestions.value.length) %
      suggestions.value.length;
    return;
  }

  if (event.key === "Enter" && suggestionsOpen.value) {
    event.preventDefault();
    event.stopPropagation();
    const selected = suggestions.value[highlightedIndex.value];
    if (selected) {
      selectSuggestion(selected);
    }
    return;
  }

  if (event.key === "Escape" && suggestionsOpen.value) {
    event.preventDefault();
    event.stopPropagation();
    suggestionsOpen.value = false;
  }
}

let removeKeydownListener: (() => void) | null = null;

watchEffect((onCleanup) => {
  removeKeydownListener?.();
  removeKeydownListener = null;

  const el = getNativeInput();
  if (!el) {
    return;
  }

  el.addEventListener("keydown", onKeydown);
  removeKeydownListener = () => el.removeEventListener("keydown", onKeydown);
  onCleanup(() => removeKeydownListener?.());
});
</script>

<template>
  <UFormField label="Tags" :description="description">
    <div
      class="relative w-full"
      role="combobox"
      :aria-expanded="hasSuggestions"
      aria-haspopup="listbox"
    >
      <UInput
        ref="inputRef"
        v-model="model"
        :placeholder="placeholder"
        autocomplete="off"
        class="w-full"
        :aria-activedescendant="
          hasSuggestions
            ? `tag-suggestion-${highlightedIndex}`
            : undefined
        "
        aria-autocomplete="list"
        @input="updateSuggestions"
        @click="updateSuggestions"
        @focus="onFocus"
        @blur="closeSuggestionsSoon"
      />

      <ul
        v-if="hasSuggestions"
        ref="listRef"
        class="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-default bg-elevated py-1 shadow-lg"
        role="listbox"
      >
        <li
          v-for="(tag, index) in suggestions"
          :id="`tag-suggestion-${index}`"
          :key="tag"
          role="option"
          :aria-selected="index === highlightedIndex"
        >
          <button
            type="button"
            class="flex w-full items-center gap-2 border-l-2 px-3 py-2 text-left text-sm transition-colors"
            :class="
              index === highlightedIndex
                ? 'border-primary bg-primary/15 font-medium text-primary'
                : 'border-transparent text-default hover:bg-muted'
            "
            @mousedown.prevent="selectSuggestion(tag)"
          >
            <UIcon
              name="i-lucide-check"
              class="size-4 shrink-0"
              :class="
                index === highlightedIndex
                  ? 'text-primary opacity-100'
                  : 'opacity-0'
              "
              aria-hidden="true"
            />
            <span>{{ tag }}</span>
          </button>
        </li>
      </ul>
    </div>
  </UFormField>
</template>
