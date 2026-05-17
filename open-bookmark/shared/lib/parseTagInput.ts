export function parseTagInput(tags: string[] | string | undefined): string[] {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return [
      ...new Set(
        tags.flatMap((tag) =>
          tag
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean),
        ),
      ),
    ];
  }

  return [
    ...new Set(
      tags
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}
