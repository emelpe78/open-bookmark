import type { H3Event } from "h3";
import { bookmarkIdParamSchema } from "../validation";

export function parseBookmarkId(event: H3Event): number {
  const params = bookmarkIdParamSchema.safeParse({
    id: getRouterParam(event, "id"),
  });

  if (!params.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ungültige Bookmark-ID.",
    });
  }

  return params.data.id;
}
