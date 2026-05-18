import type { TagsResponse } from "#shared/types/bookmark";

export function useTagSuggestions() {
  const { data, refresh, pending } = useFetch<TagsResponse>("/api/tags");

  const tagNames = computed(() =>
    (data.value?.tags ?? []).map((tag) => tag.name),
  );

  return {
    tagNames,
    pending,
    refresh,
  };
}
