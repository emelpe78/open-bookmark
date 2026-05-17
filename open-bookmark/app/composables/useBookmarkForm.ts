import { parseTagInput } from "#shared/lib/parseTagInput";

export function useBookmarkForm() {
  function parseTagsFromInput(tagsInput: string): string[] {
    return parseTagInput(tagsInput);
  }

  function buildNotesPayload(notes: string): string | null {
    const trimmed = notes.trim();
    return trimmed || null;
  }

  function validateUrlNotEmpty(url: string): string | null {
    if (!url.trim()) {
      return "Bitte eine URL eingeben.";
    }
    return null;
  }

  return {
    parseTagsFromInput,
    buildNotesPayload,
    validateUrlNotEmpty,
  };
}
