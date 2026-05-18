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
}

export interface BookmarkListResponse {
  items: Bookmark[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TagWithCount {
  id: number;
  name: string;
  count: number;
}

export interface TagsResponse {
  tags: TagWithCount[];
}

export interface TagMutationResponse {
  tag: TagWithCount;
}

export interface BulkImportResult {
  created: number;
  skipped: number;
  failed: Array<{ url: string; reason: string }>;
}

export interface CreateBookmarkResponse {
  bookmark: Bookmark;
}

export interface PageMetadata {
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
}
