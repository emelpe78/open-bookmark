import type { BookmarkListRevision } from "#shared/types/bookmarkRevision";

export function bookmarkListRevisionFingerprint(
  revision: BookmarkListRevision,
): string {
  return `${revision.total}:${revision.latestUpdatedAt ?? ""}`;
}
