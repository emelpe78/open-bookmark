import {
  apiRequest,
  type ApiRequestOptions,
  readApiError,
} from "./apiClient";
import { parseTagInput } from "../../../packages/tag-utils/src/parseTagInput";
import type {
  Bookmark,
  BookmarkListResponse,
  CreateBookmarkResponse,
  RefreshBookmarkResponse,
  BookmarkListSummary,
  ListsResponse,
  TagWithCount,
  TagsResponse,
} from "./types";

export { DEFAULT_REQUEST_TIMEOUT_MS } from "./apiClient";

export interface CreateBookmarkInput {
  url: string;
  notes?: string | null;
  tags?: string[] | string | null;
}

export type CreateBookmarkOptions = ApiRequestOptions;

function buildRequestBody(input: CreateBookmarkInput): Record<string, unknown> {
  const body: Record<string, unknown> = { url: input.url.trim() };
  const notes = input.notes?.trim();
  if (notes) {
    body.notes = notes;
  }
  const tags = parseTagInput(input.tags ?? undefined);
  if (tags.length > 0) {
    body.tags = tags;
  }
  return body;
}

export async function createBookmark(
  baseUrl: string,
  input: CreateBookmarkInput,
  options: CreateBookmarkOptions = {},
): Promise<Bookmark> {
  const response = await apiRequest(
    baseUrl,
    "/api/bookmarks",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestBody(input)),
    },
    options,
  );

  if (response.status === 201) {
    const data = (await response.json()) as CreateBookmarkResponse;
    return data.bookmark;
  }

  return readApiError(response);
}

export interface ListBookmarksParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listBookmarks(
  baseUrl: string,
  params: ListBookmarksParams = {},
  options: CreateBookmarkOptions = {},
): Promise<BookmarkListResponse> {
  const query = new URLSearchParams();
  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.page !== undefined) {
    query.set("page", String(params.page));
  }
  if (params.pageSize !== undefined) {
    query.set("pageSize", String(params.pageSize));
  }

  const path = query.size > 0 ? `/api/bookmarks?${query}` : "/api/bookmarks";

  const response = await apiRequest(baseUrl, path, { method: "GET" }, options);

  if (!response.ok) {
    return readApiError(response);
  }

  return (await response.json()) as BookmarkListResponse;
}

export interface UpdateBookmarkInput {
  notes?: string | null;
  tags?: string[] | string | null;
}

function buildUpdateBody(input: UpdateBookmarkInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (input.notes !== undefined) {
    body.notes = input.notes?.trim() ? input.notes.trim() : null;
  }
  if (input.tags !== undefined) {
    body.tags = parseTagInput(input.tags ?? undefined);
  }
  return body;
}

export async function updateBookmark(
  baseUrl: string,
  id: number,
  input: UpdateBookmarkInput,
  options: CreateBookmarkOptions = {},
): Promise<Bookmark> {
  const response = await apiRequest(
    baseUrl,
    `/api/bookmarks/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildUpdateBody(input)),
    },
    options,
  );

  if (!response.ok) {
    return readApiError(response);
  }

  const data = (await response.json()) as CreateBookmarkResponse;
  return data.bookmark;
}

export async function refreshBookmark(
  baseUrl: string,
  id: number,
  options: CreateBookmarkOptions = {},
): Promise<Bookmark> {
  const response = await apiRequest(
    baseUrl,
    `/api/bookmarks/${id}/refresh`,
    { method: "POST" },
    options,
  );

  if (!response.ok) {
    return readApiError(response);
  }

  const data = (await response.json()) as RefreshBookmarkResponse;
  return data.bookmark;
}

export async function listTags(
  baseUrl: string,
  options: CreateBookmarkOptions = {},
): Promise<TagWithCount[]> {
  const response = await apiRequest(
    baseUrl,
    "/api/tags",
    { method: "GET" },
    options,
  );

  if (!response.ok) {
    return readApiError(response);
  }

  const data = (await response.json()) as TagsResponse;
  return data.tags;
}

export async function listLists(
  baseUrl: string,
  options: CreateBookmarkOptions = {},
): Promise<BookmarkListSummary[]> {
  const response = await apiRequest(
    baseUrl,
    "/api/lists",
    { method: "GET" },
    options,
  );

  if (!response.ok) {
    return readApiError(response);
  }

  const data = (await response.json()) as ListsResponse;
  return data.lists;
}

export async function addBookmarksToList(
  baseUrl: string,
  listId: number,
  bookmarkIds: number[],
  options: CreateBookmarkOptions = {},
): Promise<void> {
  if (bookmarkIds.length === 0) {
    return;
  }

  const response = await apiRequest(
    baseUrl,
    `/api/lists/${listId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addBookmarkIds: bookmarkIds }),
    },
    options,
  );

  if (!response.ok) {
    return readApiError(response);
  }
}
