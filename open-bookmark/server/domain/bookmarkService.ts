import type { Bookmark, BulkImportResult, PageMetadata } from "#shared/types/bookmark";
import { BookmarkDomainError } from "#shared/errors/bookmarkErrors";
import { parseBookmarkExportHtml } from "#shared/lib/parseBookmarkExportHtml";
import { parseTagInput } from "#shared/lib/parseTagInput";
import { normalizeNotesInput } from "../../lib/markdown";
import { normalizeUrl, UrlValidationError } from "../utils/normalizeUrl";
import { resolvePageMetadata } from "../utils/metadata";
import {
  BookmarkRepository,
  type ListBookmarksOptions,
} from "../repositories/bookmarkRepository";
import { ListRepository } from "../repositories/listRepository";
import { TagRepository } from "../repositories/tagRepository";

export type CreateFromUrlResult = "created" | "skipped" | { failed: string };

export interface BookmarkServiceDeps {
  bookmarkRepo: BookmarkRepository;
  tagRepo: TagRepository;
  listRepo: ListRepository;
  resolveMetadata?: (url: string) => Promise<PageMetadata>;
}

export class BookmarkService {
  private readonly bookmarkRepo: BookmarkRepository;
  private readonly tagRepo: TagRepository;
  private readonly listRepo: ListRepository;
  private readonly resolveMetadata: (url: string) => Promise<PageMetadata>;

  constructor(deps: BookmarkServiceDeps) {
    this.bookmarkRepo = deps.bookmarkRepo;
    this.tagRepo = deps.tagRepo;
    this.listRepo = deps.listRepo;
    this.resolveMetadata = deps.resolveMetadata ?? resolvePageMetadata;
  }

  list(options: ListBookmarksOptions = {}) {
    const listResult = this.bookmarkRepo.list(options, new Map());
    const bookmarkIds = listResult.items.map((item) => item.id);
    const tagsByBookmarkId = this.tagRepo.getTagsForBookmarks(bookmarkIds);
    const listsByBookmarkId = this.listRepo.getListNamesForBookmarks(bookmarkIds);

    return {
      ...listResult,
      items: listResult.items.map((item) => ({
        ...item,
        tags: tagsByBookmarkId.get(item.id) ?? [],
        lists: listsByBookmarkId.get(item.id) ?? [],
      })),
    };
  }

  getListRevision() {
    return this.bookmarkRepo.getListRevision();
  }

  getById(id: number): Bookmark | null {
    const tags = this.tagRepo.getTagsForBookmark(id);
    const tagsMap = new Map([[id, tags]]);
    const bookmark = this.bookmarkRepo.findById(id, tagsMap);
    if (!bookmark) {
      return null;
    }

    const listsByBookmarkId = this.listRepo.getListNamesForBookmarks([id]);
    return {
      ...bookmark,
      lists: listsByBookmarkId.get(id) ?? [],
    };
  }

  async create(input: {
    url: string;
    notes?: string | null;
    tags?: string[] | string;
  }): Promise<Bookmark> {
    let normalized;
    try {
      normalized = normalizeUrl(input.url);
    } catch (error) {
      if (error instanceof UrlValidationError) {
        throw new BookmarkDomainError("INVALID_URL", error.message);
      }
      throw error;
    }

    if (this.bookmarkRepo.existsByNormalizedUrl(normalized.normalized_url)) {
      throw new BookmarkDomainError("DUPLICATE_URL", "Bookmark existiert bereits.");
    }

    const metadata = await this.resolveMetadata(normalized.url);
    const notes = normalizeNotesInput(input.notes);

    const id = this.bookmarkRepo.insert({
      url: normalized.url,
      normalized_url: normalized.normalized_url,
      title: metadata.title,
      description: metadata.description,
      image_url: metadata.image_url,
      site_name: metadata.site_name,
      notes,
    });

    const tagNames = parseTagInput(input.tags);
    if (tagNames.length > 0) {
      this.tagRepo.setBookmarkTags(id, tagNames);
    }

    const bookmark = this.getById(id);
    if (!bookmark) {
      throw new BookmarkDomainError("LOAD_FAILED");
    }

    return bookmark;
  }

  async importFromUrls(urlList: string[]): Promise<BulkImportResult> {
    const seenNormalized = new Set<string>();
    const seenInvalid = new Set<string>();
    const uniqueUrls: string[] = [];

    for (const entry of urlList) {
      try {
        const { normalized_url } = normalizeUrl(entry);
        if (seenNormalized.has(normalized_url)) {
          continue;
        }
        seenNormalized.add(normalized_url);
        uniqueUrls.push(entry);
      } catch {
        if (seenInvalid.has(entry)) {
          continue;
        }
        seenInvalid.add(entry);
        uniqueUrls.push(entry);
      }
    }

    let created = 0;
    let skipped = 0;
    const failed: Array<{ url: string; reason: string }> = [];

    for (const entry of uniqueUrls) {
      const result = await this.createFromUrl(entry);
      if (result === "created") {
        created++;
      } else if (result === "skipped") {
        skipped++;
      } else {
        failed.push({ url: entry, reason: result.failed });
      }
    }

    return { created, skipped, failed };
  }

  async importFromHtml(html: string): Promise<BulkImportResult> {
    const urlList = parseBookmarkExportHtml(html);
    if (urlList.length === 0) {
      throw new BookmarkDomainError(
        "INVALID_URL",
        "Keine gültigen http- oder https-Links in der HTML-Datei gefunden.",
      );
    }

    return this.importFromUrls(urlList);
  }

  async createFromUrl(rawUrl: string): Promise<CreateFromUrlResult> {
    try {
      const { normalized_url } = normalizeUrl(rawUrl);

      if (this.bookmarkRepo.existsByNormalizedUrl(normalized_url)) {
        return "skipped";
      }

      await this.create({ url: rawUrl });
      return "created";
    } catch (error) {
      if (error instanceof UrlValidationError) {
        return { failed: error.message };
      }
      if (error instanceof BookmarkDomainError) {
        if (error.code === "DUPLICATE_URL") {
          return "skipped";
        }
        return { failed: error.message };
      }
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      return { failed: message };
    }
  }

  async update(
    id: number,
    input: {
      url?: string;
      notes?: string | null;
      tags?: string[] | string;
    },
  ): Promise<Bookmark> {
    const existing = this.getById(id);
    if (!existing) {
      throw new BookmarkDomainError("NOT_FOUND");
    }

    let url = existing.url;
    let normalized_url = existing.normalized_url;
    let metadata: PageMetadata | null = null;

    if (input.url !== undefined) {
      let normalized;
      try {
        normalized = normalizeUrl(input.url);
      } catch (error) {
        if (error instanceof UrlValidationError) {
          throw new BookmarkDomainError("INVALID_URL", error.message);
        }
        throw error;
      }

      if (
        normalized.normalized_url !== existing.normalized_url &&
        this.bookmarkRepo.existsByNormalizedUrl(normalized.normalized_url)
      ) {
        throw new BookmarkDomainError("DUPLICATE_URL");
      }

      url = normalized.url;
      normalized_url = normalized.normalized_url;
      metadata = await this.resolveMetadata(url);
    }

    const notes =
      input.notes !== undefined ? normalizeNotesInput(input.notes) : existing.notes;

    if (metadata) {
      this.bookmarkRepo.updateWithMetadata(id, {
        url,
        normalized_url,
        title: metadata.title,
        description: metadata.description,
        image_url: metadata.image_url,
        site_name: metadata.site_name,
        notes,
      });
    } else {
      this.bookmarkRepo.updateNotes(id, notes);
    }

    if (input.tags !== undefined) {
      this.tagRepo.setBookmarkTags(id, parseTagInput(input.tags));
    }

    const updated = this.getById(id);
    if (!updated) {
      throw new BookmarkDomainError("LOAD_FAILED");
    }

    return updated;
  }

  async refreshMetadata(id: number): Promise<Bookmark> {
    const existing = this.getById(id);
    if (!existing) {
      throw new BookmarkDomainError("NOT_FOUND");
    }

    const metadata = await this.resolveMetadata(existing.url);
    this.bookmarkRepo.updateMetadataFields(id, metadata);

    const updated = this.getById(id);
    if (!updated) {
      throw new BookmarkDomainError("LOAD_FAILED");
    }

    return updated;
  }

  delete(id: number): boolean {
    return this.bookmarkRepo.delete(id);
  }

  listTags() {
    return this.tagRepo.listWithCounts();
  }

  createTag(name: string) {
    const tag = this.tagRepo.create(name);
    return this.tagRepo.getWithCount(tag.id)!;
  }

  updateTag(id: number, name: string) {
    this.tagRepo.update(id, name);
    const tag = this.tagRepo.getWithCount(id);
    if (!tag) {
      throw new BookmarkDomainError("TAG_NOT_FOUND");
    }
    return tag;
  }

  deleteTag(id: number): void {
    const deleted = this.tagRepo.delete(id);
    if (!deleted) {
      throw new BookmarkDomainError("TAG_NOT_FOUND");
    }
  }

  listLists() {
    return this.listRepo.listWithCounts();
  }

  getList(id: number) {
    const list = this.listRepo.getDetail(id);
    if (!list) {
      throw new BookmarkDomainError("LIST_NOT_FOUND");
    }
    return list;
  }

  createList(name: string, bookmarkIds: number[]) {
    const list = this.listRepo.create(name, bookmarkIds);
    return this.listRepo.getWithCount(list.id)!;
  }

  addBookmarksToList(listId: number, bookmarkIds: number[]) {
    const list = this.listRepo.addBookmarks(listId, bookmarkIds);
    return this.listRepo.getWithCount(list.id)!;
  }

  setListBookmarks(listId: number, bookmarkIds: number[]) {
    this.listRepo.setBookmarks(listId, bookmarkIds);
    return this.getList(listId);
  }

  updateList(
    id: number,
    input: {
      name?: string;
      bookmarkIds?: number[];
      addBookmarkIds?: number[];
    },
  ) {
    if (input.name !== undefined) {
      this.listRepo.updateName(id, input.name);
    }
    if (input.bookmarkIds !== undefined) {
      this.listRepo.setBookmarks(id, input.bookmarkIds);
    }
    if (input.addBookmarkIds && input.addBookmarkIds.length > 0) {
      this.listRepo.addBookmarks(id, input.addBookmarkIds);
    }
    return this.getList(id);
  }

  updateListName(id: number, name: string) {
    this.listRepo.updateName(id, name);
    const list = this.listRepo.getWithCount(id);
    if (!list) {
      throw new BookmarkDomainError("LIST_NOT_FOUND");
    }
    return list;
  }

  deleteList(id: number): void {
    const deleted = this.listRepo.delete(id);
    if (!deleted) {
      throw new BookmarkDomainError("LIST_NOT_FOUND");
    }
  }
}
