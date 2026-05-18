import { createBookmarkService } from "../../domain/createBookmarkService";
import { mapBookmarkErrorToH3 } from "../../utils/http/mapBookmarkError";
import { parseListId } from "../../utils/http/parseListId";

export default defineEventHandler((event) => {
  const id = parseListId(event);

  try {
    createBookmarkService().deleteList(id);
    return { ok: true };
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
