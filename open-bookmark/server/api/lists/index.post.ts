import { createBookmarkService } from "../../domain/createBookmarkService";
import { mapBookmarkErrorToH3 } from "../../utils/http/mapBookmarkError";
import { listBodySchema } from "../../utils/validation";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = listBodySchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors[0]?.message ?? "Ungültiger Request-Body.",
    });
  }

  try {
    const list = createBookmarkService().createList(
      parsed.data.name,
      parsed.data.bookmarkIds,
    );
    return { list };
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
