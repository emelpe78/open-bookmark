import { validateBookmarkHtmlSize } from "#shared/lib/parseBookmarkExportHtml";
import { createBookmarkService } from "../../domain/createBookmarkService";
import { mapBookmarkErrorToH3 } from "../../utils/http/mapBookmarkError";
import { importBookmarkHtmlBodySchema } from "../../utils/validation";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = importBookmarkHtmlBodySchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors[0]?.message ?? "Ungültiger Request-Body.",
    });
  }

  try {
    validateBookmarkHtmlSize(parsed.data.html);
  } catch (error: unknown) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : "HTML-Datei zu groß.",
    });
  }

  try {
    return await createBookmarkService().importFromHtml(parsed.data.html);
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
