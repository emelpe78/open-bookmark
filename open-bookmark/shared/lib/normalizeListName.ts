/**
 * Normalizes a list name for storage: trim and collapse whitespace.
 */
export function normalizeListName(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}
