import { createBookmarkService } from "../../domain/createBookmarkService";

export default defineEventHandler(() => {
  const lists = createBookmarkService().listLists();
  return { lists };
});
