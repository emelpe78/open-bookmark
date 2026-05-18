import { getServerBaseUrl, requestHostPermissionForBaseUrl } from "./config";
import {
  buildNotesPayload,
  hasBookmarkFormChanges,
} from "./bookmarkFormChanges";
import { findBookmarkByUrl } from "./findBookmarkByUrl";
import { mapApiErrorToUserMessage } from "./mapApiError";
import { createBookmark, updateBookmark } from "./openBookmarkApi";
import type { Bookmark } from "./types";
import { OpenBookmarkApiError } from "./types";
import { parseTagInput } from "./parseTagInput";

export interface SaveBookmarkOptions {
  notes?: string | null;
  tags?: string | null;
}

export interface SaveBookmarkResult {
  bookmark: Bookmark;
  created: boolean;
  updated: boolean;
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
      return { bookmark, created: false, updated: true };
    }

    const bookmark = await createBookmark(baseUrl, {
      url,
      notes: notesInput,
      tags: tagsInput,
    });
    return { bookmark, created: true, updated: false };
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
