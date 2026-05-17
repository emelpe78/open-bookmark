import { refreshBookmarkMetadata } from "../../../utils/bookmarks";
import { bookmarkIdParamSchema } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const params = bookmarkIdParamSchema.safeParse({
    id: getRouterParam(event, "id"),
  });

  if (!params.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ungültige Bookmark-ID.",
    });
  }

  const bookmark = await refreshBookmarkMetadata(params.data.id);
  return { bookmark };
});
