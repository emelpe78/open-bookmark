import type {
  Bookmark,
  BookmarkListResponse,
  BulkImportResult,
  CreateBookmarkResponse,
  TagsResponse,
} from "#shared/types/bookmark";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "#shared/constants/pagination";

export { PAGE_SIZE_OPTIONS };

export function useBookmarks() {
  const page = useState("bookmarks-page", () => 1);
  const pageSize = useState("bookmarks-page-size", () => DEFAULT_PAGE_SIZE);
  const search = useState("bookmarks-search", () => "");
  const tag = useState<string | undefined>("bookmarks-tag", () => undefined);
  const debouncedSearch = useState("bookmarks-debounced-search", () => "");

  let searchTimeout: ReturnType<typeof setTimeout> | undefined;

  if (import.meta.client) {
    watch(search, (value) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      searchTimeout = setTimeout(() => {
        debouncedSearch.value = value;
        page.value = 1;
      }, 300);
    });

    watch(tag, () => {
      page.value = 1;
    });

    watch(pageSize, () => {
      page.value = 1;
    });
  }

  const query = computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    search: debouncedSearch.value || undefined,
    tag: tag.value || undefined,
  }));

  const {
    data,
    pending,
    error,
    refresh,
  } = useFetch<BookmarkListResponse>("/api/bookmarks", {
    query,
    watch: [query],
  });

  const { data: tagsData, refresh: refreshTags } = useFetch<TagsResponse>("/api/tags");

  const tagOptions = computed(() =>
    (tagsData.value?.tags ?? []).map((entry) => ({
      label: `${entry.name} (${entry.count})`,
      value: entry.name,
    })),
  );

  async function createBookmark(payload: {
    url: string;
    notes?: string | null;
    tags?: string[];
  }): Promise<Bookmark> {
    const result = await $fetch<CreateBookmarkResponse>("/api/bookmarks", {
      method: "POST",
      body: payload,
    });
    await Promise.all([refresh(), refreshTags()]);
    return result.bookmark;
  }

  async function bulkImport(urls: string): Promise<BulkImportResult> {
    const result = await $fetch<BulkImportResult>("/api/bookmarks", {
      method: "POST",
      body: { urls },
    });
    await Promise.all([refresh(), refreshTags()]);
    return result;
  }

  async function updateBookmark(
    id: number,
    payload: { url?: string; notes?: string | null; tags?: string[] },
  ): Promise<Bookmark> {
    const result = await $fetch<{ bookmark: Bookmark }>(`/api/bookmarks/${id}`, {
      method: "PATCH",
      body: payload,
    });
    await Promise.all([refresh(), refreshTags()]);
    return result.bookmark;
  }

  async function deleteBookmark(id: number): Promise<void> {
    await $fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
    await Promise.all([refresh(), refreshTags()]);
  }

  async function refreshBookmarkMetadata(id: number): Promise<Bookmark> {
    const result = await $fetch<{ bookmark: Bookmark }>(`/api/bookmarks/${id}/refresh`, {
      method: "POST",
    });
    await refresh();
    return result.bookmark;
  }

  return {
    page,
    pageSize,
    search,
    tag,
    tagOptions,
    bookmarks: computed(() => data.value?.items ?? []),
    total: computed(() => data.value?.total ?? 0),
    pending,
    error,
    refresh,
    createBookmark,
    bulkImport,
    updateBookmark,
    deleteBookmark,
    refreshBookmarkMetadata,
  };
}
