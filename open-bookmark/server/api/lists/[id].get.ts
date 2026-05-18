import { createBookmarkService } from "../../domain/createBookmarkService";
import { mapBookmarkErrorToH3 } from "../../utils/http/mapBookmarkError";
import { parseListId } from "../../utils/http/parseListId";

export default defineEventHandler((event) => {
  const id = parseListId(event);

  try {
    const list = createBookmarkService().getList(id);
    return { list };
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
