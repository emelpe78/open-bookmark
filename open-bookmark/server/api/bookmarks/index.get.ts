import { createBookmarkService } from "../../domain/createBookmarkService";
import { mapBookmarkErrorToH3 } from "../../utils/http/mapBookmarkError";
import { listBookmarksQuerySchema } from "../../utils/validation";

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const parsed = listBookmarksQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors[0]?.message ?? "Ungültige Query-Parameter.",
    });
  }

  try {
    return createBookmarkService().list(parsed.data);
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
