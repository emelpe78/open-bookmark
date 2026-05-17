import { listBookmarks } from "../../utils/bookmarks";
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

  return listBookmarks(parsed.data);
});
