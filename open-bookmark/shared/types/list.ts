export interface BookmarkListSummary {
  id: number;
  name: string;
  count: number;
  created_at: string;
  updated_at: string;
}

export interface BookmarkListEntry {
  id: number;
  url: string;
  title: string | null;
  site_name: string | null;
}

export interface BookmarkListDetail {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  bookmarks: BookmarkListEntry[];
}

export interface ListsResponse {
  lists: BookmarkListSummary[];
}

export interface ListMutationResponse {
  list: BookmarkListSummary;
}

export interface ListDetailResponse {
  list: BookmarkListDetail;
}
