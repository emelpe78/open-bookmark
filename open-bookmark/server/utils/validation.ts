import { z } from "zod";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "#shared/constants/pagination";

export const listBookmarksQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .optional()
    .default(DEFAULT_PAGE_SIZE),
  tag: z.string().optional(),
});

export const createBookmarkBodySchema = z
  .object({
    url: z.string().optional(),
    urls: z.string().optional(),
    notes: z.string().nullable().optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
  })
  .refine((data) => Boolean(data.url?.trim() || data.urls?.trim()), {
    message: "url oder urls ist erforderlich.",
  });

export const updateBookmarkBodySchema = z.object({
  url: z.string().optional(),
  notes: z.string().nullable().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
});

export const bookmarkIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
