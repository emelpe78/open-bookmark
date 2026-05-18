import type {
  BookmarkListDetail,
  BookmarkListSummary,
  ListDetailResponse,
  ListMutationResponse,
  ListsResponse,
} from "#shared/types/list";

export function useListAdmin() {
  const {
    data,
    pending,
    error,
    refresh,
  } = useFetch<ListsResponse>("/api/lists");

  const lists = computed(() => data.value?.lists ?? []);

  async function syncBookmarkViews(): Promise<void> {
    await refresh();
    const { refreshViews } = useBookmarks();
    await refreshViews();
  }

  async function createList(
    name: string,
    bookmarkIds: number[],
  ): Promise<BookmarkListSummary> {
    const result = await $fetch<ListMutationResponse>("/api/lists", {
      method: "POST",
      body: { name, bookmarkIds },
    });
    await syncBookmarkViews();
    return result.list;
  }

  async function fetchListDetail(id: number) {
    return $fetch<ListDetailResponse>(`/api/lists/${id}`);
  }

  async function updateList(
    id: number,
    payload: { name?: string; bookmarkIds?: number[] },
  ): Promise<BookmarkListDetail> {
    const previous = lists.value.find((entry) => entry.id === id);
    const result = await $fetch<ListDetailResponse>(`/api/lists/${id}`, {
      method: "PATCH",
      body: payload,
    });
    await syncBookmarkViews();
    const { list } = useBookmarks();
    if (previous && list.value === previous.name && payload.name) {
      list.value = payload.name;
    }
    return result.list;
  }

  async function addBookmarksToList(
    listId: number,
    bookmarkIds: number[],
  ): Promise<BookmarkListDetail> {
    const result = await $fetch<ListDetailResponse>(`/api/lists/${listId}`, {
      method: "PATCH",
      body: { addBookmarkIds: bookmarkIds },
    });
    await syncBookmarkViews();
    return result.list;
  }

  async function deleteList(id: number): Promise<void> {
    const removed = lists.value.find((entry) => entry.id === id);
    await $fetch(`/api/lists/${id}`, { method: "DELETE" });
    await syncBookmarkViews();
    const { list } = useBookmarks();
    if (removed && list.value === removed.name) {
      list.value = undefined;
    }
  }

  return {
    lists,
    pending,
    error,
    refresh,
    createList,
    fetchListDetail,
    updateList,
    addBookmarksToList,
    deleteList,
  };
}
