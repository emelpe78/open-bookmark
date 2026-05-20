import { getServerBaseUrl, requestHostPermissionForBaseUrl } from "./config";
import {
  buildNotesPayload,
  hasBookmarkFormChanges,
} from "./bookmarkFormChanges";
import { findBookmarkByUrl } from "./findBookmarkByUrl";
import { mapApiErrorToUserMessage } from "./mapApiError";
import { parseTagInput } from "../../../packages/tag-utils/src/parseTagInput";
import {
  addBookmarksToList,
  createBookmark,
  updateBookmark,
} from "./openBookmarkApi";
import type { Bookmark } from "./types";
import { OpenBookmarkApiError } from "./types";

export interface SaveBookmarkOptions {
  notes?: string | null;
  tags?: string | null;
  listId?: number | null;
}

export interface SaveBookmarkResult {
  bookmark: Bookmark;
  created: boolean;
  updated: boolean;
  addedToList: boolean;
}

async function ensureHostAccess(baseUrl: string): Promise<void> {
  const granted = await requestHostPermissionForBaseUrl(baseUrl);
  if (!granted) {
    throw new OpenBookmarkApiError(
      "config",
      "Bitte prüfe die Server-Adresse in den Extension-Einstellungen.",
    );
  }
}

export async function saveOrUpdateBookmark(
  url: string,
  options: SaveBookmarkOptions = {},
): Promise<SaveBookmarkResult> {
  const baseUrl = await getServerBaseUrl();
  await ensureHostAccess(baseUrl);

  const tagsInput = options.tags ?? "";
  const notesInput = options.notes ?? "";

  try {
    const existing = await findBookmarkByUrl(baseUrl, url);

    if (existing) {
      if (!hasBookmarkFormChanges(existing, tagsInput, notesInput)) {
        if (options.listId) {
          await addBookmarksToList(baseUrl, options.listId, [existing.id]);
          return {
            bookmark: existing,
            created: false,
            updated: false,
            addedToList: true,
          };
        }

        throw new OpenBookmarkApiError(
          "duplicate",
          "Diese Seite ist bereits in Open Bookmark gespeichert.",
          409,
        );
      }

      const bookmark = await updateBookmark(baseUrl, existing.id, {
        notes: buildNotesPayload(notesInput),
        tags: parseTagInput(tagsInput),
      });

      let addedToList = false;
      if (options.listId) {
        await addBookmarksToList(baseUrl, options.listId, [bookmark.id]);
        addedToList = true;
      }

      return { bookmark, created: false, updated: true, addedToList };
    }

    const bookmark = await createBookmark(baseUrl, {
      url,
      notes: notesInput,
      tags: tagsInput,
    });

    let addedToList = false;
    if (options.listId) {
      await addBookmarksToList(baseUrl, options.listId, [bookmark.id]);
      addedToList = true;
    }

    return { bookmark, created: true, updated: false, addedToList };
  } catch (error) {
    if (error instanceof OpenBookmarkApiError) {
      throw error;
    }
    throw new Error(mapApiErrorToUserMessage(error));
  }
}

export async function saveBookmark(
  url: string,
  options: SaveBookmarkOptions = {},
): Promise<Bookmark> {
  const result = await saveOrUpdateBookmark(url, options);
  return result.bookmark;
}
