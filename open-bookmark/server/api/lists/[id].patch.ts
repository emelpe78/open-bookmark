import { createBookmarkService } from "../../domain/createBookmarkService";
import { mapBookmarkErrorToH3 } from "../../utils/http/mapBookmarkError";
import { parseListId } from "../../utils/http/parseListId";
import { listPatchBodySchema } from "../../utils/validation";

export default defineEventHandler(async (event) => {
  const id = parseListId(event);
  const body = await readBody(event);
  const parsed = listPatchBodySchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors[0]?.message ?? "Ungültiger Request-Body.",
    });
  }

  try {
    const list = createBookmarkService().updateList(id, {
      name: parsed.data.name,
      bookmarkIds: parsed.data.bookmarkIds,
      addBookmarkIds: parsed.data.addBookmarkIds,
    });
    return { list };
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
