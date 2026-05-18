import type { H3Event } from "h3";
import { listIdParamSchema } from "../validation";

export function parseListId(event: H3Event): number {
  const params = listIdParamSchema.safeParse({
    id: getRouterParam(event, "id"),
  });

  if (!params.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ungültige Listen-ID.",
    });
  }

  return params.data.id;
}
