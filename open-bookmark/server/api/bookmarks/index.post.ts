import { createBookmarkService } from "../../domain/createBookmarkService";
import { mapBookmarkErrorToH3 } from "../../utils/http/mapBookmarkError";
import { parseUrlList } from "../../utils/normalizeUrl";
import { createBookmarkBodySchema } from "../../utils/validation";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = createBookmarkBodySchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.errors[0]?.message ?? "Ungültiger Request-Body.",
    });
  }

  const { url, urls, notes, tags } = parsed.data;
  const service = createBookmarkService();

  try {
    if (urls?.trim()) {
      const urlList = parseUrlList(urls);
      if (urlList.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: "Mindestens eine URL ist erforderlich.",
        });
      }

      let created = 0;
      let skipped = 0;
      const failed: Array<{ url: string; reason: string }> = [];

      for (const entry of urlList) {
        const result = await service.createFromUrl(entry);
        if (result === "created") {
          created++;
        } else if (result === "skipped") {
          skipped++;
        } else {
          failed.push({ url: entry, reason: result.failed });
        }
      }

      return { created, skipped, failed };
    }

    if (!url?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "url ist erforderlich.",
      });
    }

    const bookmark = await service.create({ url, notes, tags });
    setResponseStatus(event, 201);
    return { bookmark };
  } catch (error) {
    mapBookmarkErrorToH3(error);
  }
});
