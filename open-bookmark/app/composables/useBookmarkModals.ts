import type { Bookmark } from "../../shared/types/bookmark";

export function useBookmarkModals() {
  const editingBookmark = useState<Bookmark | null>("bookmark-editing", () => null);
  const editingId = useState<number | null>("bookmark-editing-id", () => null);
  const addOpen = useState("bookmark-add-open", () => false);
  const editOpen = useState("bookmark-edit-open", () => false);

  function openAdd() {
    addOpen.value = true;
  }

  function closeAdd() {
    addOpen.value = false;
  }

  function openEdit(bookmark: Bookmark) {
    editingBookmark.value = bookmark;
    editingId.value = bookmark.id;
    editOpen.value = true;
  }

  function closeEdit() {
    editOpen.value = false;
    editingBookmark.value = null;
    editingId.value = null;
  }

  return {
    addOpen,
    editOpen,
    editingBookmark,
    editingId,
    openAdd,
    closeAdd,
    openEdit,
    closeEdit,
  };
}
