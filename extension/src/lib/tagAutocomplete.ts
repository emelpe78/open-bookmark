import {
  applyTagSuggestion,
  filterTagSuggestions,
  getTagInputState,
} from "../../../packages/tag-utils/src/tagInputComposer";
import { getTagCache, refreshTagCache } from "./tagCache";
import { getServerBaseUrl, originPatternFromBaseUrl } from "./config";

export interface TagAutocompleteHandle {
  detach: () => void;
  reload: () => Promise<void>;
}

export function attachTagAutocomplete(
  input: HTMLInputElement,
  list: HTMLUListElement,
): TagAutocompleteHandle {
  let allTagNames: string[] = [];
  let highlightedIndex = 0;

  async function loadTags(): Promise<void> {
    const cached = await getTagCache();
    if (cached) {
      allTagNames = cached.tags.map((tag) => tag.name);
    }

    const baseUrl = await getServerBaseUrl();
    const hasPermission = await chrome.permissions.contains({
      origins: [originPatternFromBaseUrl(baseUrl)],
    });
    if (!hasPermission) {
      return;
    }

    try {
      const tags = await refreshTagCache(baseUrl);
      allTagNames = tags.map((tag) => tag.name);
    } catch {
      // Keep cached names when refresh fails.
    }
  }

  function hideList(): void {
    list.hidden = true;
    list.innerHTML = "";
  }

  function renderSuggestions(): void {
    const state = getTagInputState(
      input.value,
      input.selectionStart ?? input.value.length,
    );
    if (state.fragmentNormalized.length === 0) {
      hideList();
      return;
    }
    const suggestions = filterTagSuggestions(allTagNames, state);

    list.innerHTML = "";
    if (suggestions.length === 0) {
      hideList();
      return;
    }

    highlightedIndex = 0;
    for (let index = 0; index < suggestions.length; index += 1) {
      const tag = suggestions[index]!;
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "popup__tag-suggestion";
      button.textContent = tag;
      if (index === 0) {
        button.classList.add("popup__tag-suggestion--active");
      }
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        selectTag(tag);
      });
      item.appendChild(button);
      list.appendChild(item);
    }

    list.hidden = false;
  }

  function selectTag(tagName: string): void {
    const cursor = input.selectionStart ?? input.value.length;
    const { value, cursorPos } = applyTagSuggestion(input.value, tagName, cursor);
    input.value = value;
    input.setSelectionRange(cursorPos, cursorPos);
    hideList();
    input.focus();
  }

  function updateHighlight(): void {
    const buttons = list.querySelectorAll<HTMLButtonElement>(
      ".popup__tag-suggestion",
    );
    buttons.forEach((button, index) => {
      button.classList.toggle(
        "popup__tag-suggestion--active",
        index === highlightedIndex,
      );
    });
  }

  function onInput(): void {
    renderSuggestions();
  }

  function onFocus(): void {
    renderSuggestions();
  }

  function onBlur(): void {
    window.setTimeout(hideList, 150);
  }

  function onKeydown(event: KeyboardEvent): void {
    if (list.hidden) {
      return;
    }

    const buttons = list.querySelectorAll<HTMLButtonElement>(
      ".popup__tag-suggestion",
    );
    if (buttons.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      highlightedIndex = (highlightedIndex + 1) % buttons.length;
      updateHighlight();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      highlightedIndex =
        (highlightedIndex - 1 + buttons.length) % buttons.length;
      updateHighlight();
    } else if (event.key === "Enter") {
      event.preventDefault();
      buttons[highlightedIndex]?.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
    } else if (event.key === "Escape") {
      hideList();
    }
  }

  void loadTags();

  input.addEventListener("input", onInput);
  input.addEventListener("focus", onFocus);
  input.addEventListener("blur", onBlur);
  input.addEventListener("keydown", onKeydown);
  input.addEventListener("click", onInput);
  input.addEventListener("keyup", onInput);

  const detach = () => {
    input.removeEventListener("input", onInput);
    input.removeEventListener("focus", onFocus);
    input.removeEventListener("blur", onBlur);
    input.removeEventListener("keydown", onKeydown);
    input.removeEventListener("click", onInput);
    input.removeEventListener("keyup", onInput);
  };

  return { detach, reload: loadTags };
}
