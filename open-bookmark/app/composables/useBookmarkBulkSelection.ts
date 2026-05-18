export type BookmarkBulkMode = "remove" | "list-create" | "list-add";

export function useBookmarkBulkSelection() {
  const mode = useState<BookmarkBulkMode | null>("bookmark-bulk-mode", () => null);
  const selectedIds = useState<number[]>("bookmark-bulk-ids", () => []);
  const removeConfirmOpen = useState("bookmark-bulk-remove-confirm", () => false);
  const listCreateDialogOpen = useState("bookmark-bulk-list-create-dialog", () => false);
  const listAddDialogOpen = useState("bookmark-bulk-list-add-dialog", () => false);

  const active = computed(() => mode.value !== null);
  const isRemoveMode = computed(() => mode.value === "remove");
  const isListMode = computed(
    () => mode.value === "list-create" || mode.value === "list-add",
  );
  const isListCreateMode = computed(() => mode.value === "list-create");
  const isListAddMode = computed(() => mode.value === "list-add");
  const selectedCount = computed(() => selectedIds.value.length);

  function isSelected(id: number): boolean {
    return selectedIds.value.includes(id);
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

  function toggleId(id: number): void {
    setIdSelection(id, !selectedIds.value.includes(id));
  }

  function clearSelection(): void {
    selectedIds.value = [];
  }

  function enter(nextMode: BookmarkBulkMode): void {
    if (mode.value !== nextMode) {
      clearSelection();
    }
    mode.value = nextMode;
    removeConfirmOpen.value = false;
    listCreateDialogOpen.value = false;
    listAddDialogOpen.value = false;
  }

  function cancel(): void {
    mode.value = null;
    removeConfirmOpen.value = false;
    listCreateDialogOpen.value = false;
    listAddDialogOpen.value = false;
    clearSelection();
  }

  function openRemoveConfirm(): void {
    if (selectedCount.value > 0) {
      removeConfirmOpen.value = true;
    }
  }

  function closeRemoveConfirm(): void {
    removeConfirmOpen.value = false;
  }

  function openListCreateDialog(): void {
    if (selectedCount.value > 0) {
      listCreateDialogOpen.value = true;
    }
  }

  function openListAddDialog(): void {
    if (selectedCount.value > 0) {
      listAddDialogOpen.value = true;
    }
  }

  function closeListCreateDialog(): void {
    listCreateDialogOpen.value = false;
  }

  function closeListAddDialog(): void {
    listAddDialogOpen.value = false;
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

  function allOnPageSelected(pageIds: number[]): boolean {
    return (
      pageIds.length > 0 && pageIds.every((id) => selectedIds.value.includes(id))
    );
  }

  return {
    mode,
    active,
    isRemoveMode,
    isListMode,
    isListCreateMode,
    isListAddMode,
    selectedIds,
    selectedCount,
    removeConfirmOpen,
    listCreateDialogOpen,
    listAddDialogOpen,
    isSelected,
    toggleId,
    setIdSelection,
    clearSelection,
    enter,
    cancel,
    openRemoveConfirm,
    closeRemoveConfirm,
    openListCreateDialog,
    openListAddDialog,
    closeListCreateDialog,
    closeListAddDialog,
    setPageSelection,
    allOnPageSelected,
  };
}
