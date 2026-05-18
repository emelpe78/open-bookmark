export interface Bookmark {
  id: number;
  url: string;
  normalized_url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
  lists?: string[];
}

export interface CreateBookmarkResponse {
  bookmark: Bookmark;
}

export interface TagWithCount {
  id: number;
  name: string;
  count: number;
}

export interface TagsResponse {
  tags: TagWithCount[];
}

export interface BookmarkListSummary {
  id: number;
  name: string;
  count: number;
  created_at: string;
  updated_at: string;
}

export interface ListsResponse {
  lists: BookmarkListSummary[];
}

export interface BookmarkListResponse {
  items: Bookmark[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RefreshBookmarkResponse {
  bookmark: Bookmark;
}

export type OpenBookmarkApiErrorKind =
  | "network"
  | "config"
  | "duplicate"
  | "validation"
  | "server";

export class OpenBookmarkApiError extends Error {
  readonly kind: OpenBookmarkApiErrorKind;
  readonly statusCode?: number;

  constructor(
    kind: OpenBookmarkApiErrorKind,
    message: string,
    statusCode?: number,
  ) {
    super(message);
    this.name = "OpenBookmarkApiError";
    this.kind = kind;
    this.statusCode = statusCode;
  }
}
