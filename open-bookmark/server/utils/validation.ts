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
  list: z.string().optional(),
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

export const tagIdParamSchema = bookmarkIdParamSchema;

export const tagBodySchema = z.object({
  name: z.string().trim().min(1, "Tag-Name ist erforderlich."),
});

export const listIdParamSchema = bookmarkIdParamSchema;

export const listBodySchema = z.object({
  name: z.string().trim().min(1, "Listenname ist erforderlich."),
  bookmarkIds: z.array(z.coerce.number().int().positive()).optional().default([]),
});

export const importBookmarkHtmlBodySchema = z.object({
  html: z.string().min(1, "HTML darf nicht leer sein."),
});

export const listPatchBodySchema = z
  .object({
    name: z.string().trim().min(1, "Listenname ist erforderlich.").optional(),
    bookmarkIds: z.array(z.coerce.number().int().positive()).optional(),
    addBookmarkIds: z.array(z.coerce.number().int().positive()).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined
      || data.bookmarkIds !== undefined
      || (data.addBookmarkIds !== undefined && data.addBookmarkIds.length > 0),
    { message: "name, bookmarkIds oder addBookmarkIds ist erforderlich." },
  );
