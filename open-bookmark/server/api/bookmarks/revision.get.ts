import { createBookmarkService } from "../../domain/createBookmarkService";
import { mapBookmarkErrorToH3 } from "../../utils/http/mapBookmarkError";

export default defineEventHandler(() => {
  try {
    return createBookmarkService().getListRevision();
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
