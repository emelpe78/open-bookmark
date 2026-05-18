import type { H3Event } from "h3";
import { tagIdParamSchema } from "../validation";

export function parseTagId(event: H3Event): number {
  const params = tagIdParamSchema.safeParse({
    id: getRouterParam(event, "id"),
  });

  if (!params.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ungültige Tag-ID.",
    });
  }

  return params.data.id;
}
