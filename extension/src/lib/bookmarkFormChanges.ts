import { parseTagInput } from "../../../packages/tag-utils/src/parseTagInput";
import type { Bookmark } from "./types";

function sortedTags(tags: string[]): string[] {
  return [...tags].sort((a, b) => a.localeCompare(b, "de"));
}

export function tagsEqual(a: string[], b: string[]): boolean {
  const left = sortedTags(a);
  const right = sortedTags(b);
  return left.length === right.length && left.every((tag, i) => tag === right[i]);
}

export function normalizeNotesForForm(notes: string | null | undefined): string {
  return notes?.trim() ?? "";
}

export function hasBookmarkFormChanges(
  existing: Bookmark,
  tagsInput: string,
  notesInput: string,
): boolean {
  const nextTags = parseTagInput(tagsInput);
  const nextNotes = normalizeNotesForForm(notesInput);
  const existingNotes = normalizeNotesForForm(existing.notes);
  return !tagsEqual(existing.tags, nextTags) || nextNotes !== existingNotes;
}

export function buildNotesPayload(notesInput: string): string | null {
  const trimmed = notesInput.trim();
  return trimmed || null;
}
