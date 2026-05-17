import { createBookmarkService } from "../../../domain/createBookmarkService";
import { mapBookmarkErrorToH3 } from "../../../utils/http/mapBookmarkError";
import { parseBookmarkId } from "../../../utils/http/parseRouteParams";
import { updateBookmarkBodySchema } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const id = parseBookmarkId(event);
  const body = await readBody(event);
  const parsed = updateBookmarkBodySchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors[0]?.message ?? "Ungültiger Request-Body.",
    });
  }

  try {
    const bookmark = await createBookmarkService().update(id, parsed.data);
    return { bookmark };
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
