export function useBookmarkBulkRemove() {
  const active = useState("bookmark-bulk-remove-active", () => false);
  const selectedIds = useState<number[]>("bookmark-bulk-remove-ids", () => []);
  const confirmOpen = useState("bookmark-bulk-remove-confirm", () => false);

  const selectedCount = computed(() => selectedIds.value.length);

  function isSelected(id: number): boolean {
    return selectedIds.value.includes(id);
  }

  function toggleId(id: number): void {
    setIdSelection(id, !selectedIds.value.includes(id));
  }

  function setIdSelection(id: number, selected: boolean): void {
    if (selected) {
      if (!selectedIds.value.includes(id)) {
        selectedIds.value = [...selectedIds.value, id];
      }
    } else {
      selectedIds.value = selectedIds.value.filter((entry) => entry !== id);
    }
  }

  function clearSelection(): void {
    selectedIds.value = [];
  }

  function enter(): void {
    active.value = true;
  }

  function cancel(): void {
    active.value = false;
    confirmOpen.value = false;
    clearSelection();
  }

  function openConfirm(): void {
    if (selectedCount.value > 0) {
      confirmOpen.value = true;
    }
  }

  function closeConfirm(): void {
    confirmOpen.value = false;
  }

  function setPageSelection(pageIds: number[], selected: boolean): void {
    if (pageIds.length === 0) {
      return;
    }
    const pageSet = new Set(pageIds);
    if (selected) {
      selectedIds.value = [...new Set([...selectedIds.value, ...pageIds])];
    } else {
      selectedIds.value = selectedIds.value.filter((id) => !pageSet.has(id));
    }
  }

  function toggleSelectAllOnPage(pageIds: number[]): void {
    if (pageIds.length === 0) {
      return;
    }
    const allSelected = pageIds.every((id) => selectedIds.value.includes(id));
    setPageSelection(pageIds, !allSelected);
  }

  function allOnPageSelected(pageIds: number[]): boolean {
    return (
      pageIds.length > 0 && pageIds.every((id) => selectedIds.value.includes(id))
    );
  }

  return {
    active,
    selectedIds,
    selectedCount,
    confirmOpen,
    isSelected,
    toggleId,
    setIdSelection,
    clearSelection,
    enter,
    cancel,
    openConfirm,
    closeConfirm,
    setPageSelection,
    toggleSelectAllOnPage,
    allOnPageSelected,
  };
}
