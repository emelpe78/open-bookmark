import { createBookmarkService } from "../../../domain/createBookmarkService";
import { mapBookmarkErrorToH3 } from "../../../utils/http/mapBookmarkError";
import { parseBookmarkId } from "../../../utils/http/parseRouteParams";

export default defineEventHandler(async (event) => {
  const id = parseBookmarkId(event);

  try {
    const bookmark = await createBookmarkService().refreshMetadata(id);
    return { bookmark };
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
