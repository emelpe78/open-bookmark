/**
 * Normalizes a tag for storage: lowercase, no spaces, words joined by hyphens.
 * Keep in sync with open-bookmark/shared/lib/normalizeTagName.ts
 */
export function normalizeTagName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
