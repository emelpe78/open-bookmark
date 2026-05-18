import { originPatternFromBaseUrl } from "./config";
import { listTags } from "./openBookmarkApi";
import type { TagWithCount } from "./types";

const CACHE_KEY = "tagSuggestionsCache";
export const TAG_CACHE_TTL_MS = 5 * 60 * 1000;

export interface TagCacheEntry {
  tags: TagWithCount[];
  fetchedAt: number;
}

export function isTagCacheFresh(
  fetchedAt: number,
  now = Date.now(),
  ttlMs = TAG_CACHE_TTL_MS,
): boolean {
  return now - fetchedAt < ttlMs;
}

export async function getTagCache(): Promise<TagCacheEntry | null> {
  const result = await chrome.storage.local.get(CACHE_KEY);
  const entry = result[CACHE_KEY] as TagCacheEntry | undefined;
  if (!entry || !Array.isArray(entry.tags) || typeof entry.fetchedAt !== "number") {
    return null;
  }
  return entry;
}

export async function setTagCache(tags: TagWithCount[]): Promise<void> {
  const entry: TagCacheEntry = { tags, fetchedAt: Date.now() };
  await chrome.storage.local.set({ [CACHE_KEY]: entry });
}

export function renderTagDatalist(
  datalist: HTMLDataListElement,
  tags: TagWithCount[],
): void {
  datalist.innerHTML = "";
  for (const tag of tags) {
    const option = document.createElement("option");
    option.value = tag.name;
    datalist.appendChild(option);
  }
}

export async function refreshTagCache(baseUrl: string): Promise<TagWithCount[]> {
  const tags = await listTags(baseUrl);
  await setTagCache(tags);
  return tags;
}

export async function loadTagSuggestionsInto(
  datalist: HTMLDataListElement,
  baseUrl: string,
): Promise<void> {
  const cached = await getTagCache();
  if (cached) {
    renderTagDatalist(datalist, cached.tags);
  }

  const hasPermission = await chrome.permissions.contains({
    origins: [originPatternFromBaseUrl(baseUrl)],
  });
  if (!hasPermission) {
    return;
  }

  if (cached && isTagCacheFresh(cached.fetchedAt)) {
    return;
  }

  try {
    const tags = await refreshTagCache(baseUrl);
    renderTagDatalist(datalist, tags);
  } catch {
    // Keep stale cache visible when refresh fails.
  }
}
