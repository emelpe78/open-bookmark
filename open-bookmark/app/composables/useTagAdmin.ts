import type { TagMutationResponse, TagWithCount, TagsResponse } from "#shared/types/bookmark";

export function useTagAdmin() {
  const {
    data,
    pending,
    error,
    refresh,
  } = useFetch<TagsResponse>("/api/tags");

  const tags = computed(() => data.value?.tags ?? []);

  async function syncBookmarkViews(): Promise<void> {
    await refresh();
    const { refreshViews } = useBookmarks();
    await refreshViews();
  }

  async function createTag(name: string): Promise<TagWithCount> {
    const result = await $fetch<TagMutationResponse>("/api/tags", {
      method: "POST",
      body: { name },
    });
    await syncBookmarkViews();
    return result.tag;
  }

  async function updateTag(id: number, name: string): Promise<TagWithCount> {
    const previous = tags.value.find((entry) => entry.id === id);
    const result = await $fetch<TagMutationResponse>(`/api/tags/${id}`, {
      method: "PATCH",
      body: { name },
    });
    await syncBookmarkViews();
    const { tag } = useBookmarks();
    if (previous && tag.value === previous.name) {
      tag.value = result.tag.name;
    }
    return result.tag;
  }

  async function deleteTag(id: number): Promise<void> {
    const removed = tags.value.find((entry) => entry.id === id);
    await $fetch(`/api/tags/${id}`, { method: "DELETE" });
    await syncBookmarkViews();
    const { tag } = useBookmarks();
    if (removed && tag.value === removed.name) {
      tag.value = undefined;
    }
  }

  return {
    tags,
    pending,
    error,
    refresh,
    createTag,
    updateTag,
    deleteTag,
  };
}
