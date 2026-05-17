import { updateBookmark } from "../../../utils/bookmarks";
import {
  bookmarkIdParamSchema,
  updateBookmarkBodySchema,
} from "../../../utils/validation";

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

  const body = await readBody(event);
  const parsed = updateBookmarkBodySchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors[0]?.message ?? "Ungültiger Request-Body.",
    });
  }

  const bookmark = await updateBookmark(params.data.id, parsed.data);
  return { bookmark };
});
