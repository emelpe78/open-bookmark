import { listBookmarks } from "./openBookmarkApi";
import type { ApiRequestOptions } from "./apiClient";
import type { Bookmark } from "./types";

function normalizeUrlForMatch(input: string): string {
  try {
    const parsed = new URL(input.trim());
    parsed.hostname = parsed.hostname.toLowerCase();
    let path = parsed.pathname;
    if (path !== "/" && path.endsWith("/")) {
      path = path.replace(/\/+$/, "");
    }
    parsed.pathname = path;
    return parsed.toString();
  } catch {
    return input.trim();
  }
}

export function pickExactBookmarkMatch(
  items: Bookmark[],
  pageUrl: string,
): Bookmark | null {
  const target = normalizeUrlForMatch(pageUrl);
  return (
    items.find(
      (item) =>
        item.normalized_url === target ||
        item.url === target ||
        normalizeUrlForMatch(item.url) === target,
    ) ?? null
  );
}

export async function findBookmarkByUrl(
  baseUrl: string,
  pageUrl: string,
  options: ApiRequestOptions = {},
): Promise<Bookmark | null> {
  const result = await listBookmarks(
    baseUrl,
    { search: pageUrl, pageSize: 25 },
    options,
  );
  return pickExactBookmarkMatch(result.items, pageUrl);
}
