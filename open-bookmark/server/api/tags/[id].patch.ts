import { createBookmarkService } from "../../domain/createBookmarkService";
import { mapBookmarkErrorToH3 } from "../../utils/http/mapBookmarkError";
import { parseTagId } from "../../utils/http/parseTagId";
import { tagBodySchema } from "../../utils/validation";

export default defineEventHandler(async (event) => {
  const id = parseTagId(event);
  const body = await readBody(event);
  const parsed = tagBodySchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors[0]?.message ?? "Ungültiger Request-Body.",
    });
  }

  try {
    const tag = createBookmarkService().updateTag(id, parsed.data.name);
    return { tag };
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
