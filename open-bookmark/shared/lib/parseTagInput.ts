import { normalizeTagName } from "./normalizeTagName";

function normalizeParts(parts: string[]): string[] {
  return [...new Set(parts.map(normalizeTagName).filter(Boolean))];
}

export function parseTagInput(tags: string[] | string | undefined): string[] {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return normalizeParts(
      tags.flatMap((tag) =>
        tag
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean),
      ),
    );
  }

  return normalizeParts(
    tags
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
}
