import { createBookmarkService } from "../../../domain/createBookmarkService";
import { BookmarkDomainError } from "../../../../shared/errors/bookmarkErrors";
import { mapBookmarkErrorToH3 } from "../../../utils/http/mapBookmarkError";
import { parseBookmarkId } from "../../../utils/http/parseRouteParams";

export default defineEventHandler((event) => {
  const id = parseBookmarkId(event);

  try {
    const deleted = createBookmarkService().delete(id);

    if (!deleted) {
      throw new BookmarkDomainError("NOT_FOUND");
    }

    setResponseStatus(event, 204);
    return null;
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
