import { deleteBookmark } from "../../../utils/bookmarks";
import { bookmarkIdParamSchema } from "../../../utils/validation";

export default defineEventHandler((event) => {
  const params = bookmarkIdParamSchema.safeParse({
    id: getRouterParam(event, "id"),
  });

  if (!params.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ungültige Bookmark-ID.",
    });
  }

  const deleted = deleteBookmark(params.data.id);

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: "Bookmark nicht gefunden.",
    });
  }

  setResponseStatus(event, 204);
  return null;
});
