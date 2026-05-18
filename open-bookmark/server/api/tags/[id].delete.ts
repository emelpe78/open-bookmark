import { createBookmarkService } from "../../domain/createBookmarkService";
import { mapBookmarkErrorToH3 } from "../../utils/http/mapBookmarkError";
import { parseTagId } from "../../utils/http/parseTagId";

export default defineEventHandler((event) => {
  const id = parseTagId(event);

  try {
    createBookmarkService().deleteTag(id);
    return { ok: true };
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
