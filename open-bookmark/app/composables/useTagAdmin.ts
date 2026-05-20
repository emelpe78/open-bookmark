import type { TagMutationResponse, TagWithCount, TagsResponse } from "#shared/types/bookmark";

export function useTagAdmin() {
  const {
    data,
    pending,
    error,
    refresh,
  } = useFetch<TagsResponse>("/api/tags");

  const tags = computed(() => data.value?.tags ?? []);

  async function createTag(name: string): Promise<TagWithCount> {
    const result = await $fetch<TagMutationResponse>("/api/tags", {
      method: "POST",
      body: { name },
    });
    await refresh();
    const { refreshViews } = useBookmarks();
    await refreshViews();
    return result.tag;
  }

  async function updateTag(id: number, name: string): Promise<TagWithCount> {
    const previous = tags.value.find((entry) => entry.id === id);
    const result = await $fetch<TagMutationResponse>(`/api/tags/${id}`, {
      method: "PATCH",
      body: { name },
    });
    await refresh();
    const { refreshViews, tag } = useBookmarks();
    await refreshViews();
    if (previous && tag.value === previous.name) {
      tag.value = result.tag.name;
    }
    return result.tag;
  }

  async function deleteTag(id: number): Promise<void> {
    const removed = tags.value.find((entry) => entry.id === id);
    await $fetch(`/api/tags/${id}`, { method: "DELETE" });
    await refresh();
    const { refreshViews, tag } = useBookmarks();
    await refreshViews();
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
