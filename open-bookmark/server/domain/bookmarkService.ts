import type { Bookmark, PageMetadata } from "#shared/types/bookmark";
import { BookmarkDomainError } from "#shared/errors/bookmarkErrors";
import { parseTagInput } from "#shared/lib/parseTagInput";
import { normalizeNotesInput } from "../../lib/markdown";
import { normalizeUrl, UrlValidationError } from "../utils/normalizeUrl";
import { resolvePageMetadata } from "../utils/metadata";
import {
  BookmarkRepository,
  type ListBookmarksOptions,
} from "../repositories/bookmarkRepository";
import { TagRepository } from "../repositories/tagRepository";

export type CreateFromUrlResult = "created" | "skipped" | { failed: string };

export interface BookmarkServiceDeps {
  bookmarkRepo: BookmarkRepository;
  tagRepo: TagRepository;
  resolveMetadata?: (url: string) => Promise<PageMetadata>;
}

export class BookmarkService {
  private readonly bookmarkRepo: BookmarkRepository;
  private readonly tagRepo: TagRepository;
  private readonly resolveMetadata: (url: string) => Promise<PageMetadata>;

  constructor(deps: BookmarkServiceDeps) {
    this.bookmarkRepo = deps.bookmarkRepo;
    this.tagRepo = deps.tagRepo;
    this.resolveMetadata = deps.resolveMetadata ?? resolvePageMetadata;
  }

  list(options: ListBookmarksOptions = {}) {
    const listResult = this.bookmarkRepo.list(options, new Map());
    const tagsByBookmarkId = this.tagRepo.getTagsForBookmarks(
      listResult.items.map((item) => item.id),
    );

    return {
      ...listResult,
      items: listResult.items.map((item) => ({
        ...item,
        tags: tagsByBookmarkId.get(item.id) ?? [],
      })),
    };
  }

  getListRevision() {
    return this.bookmarkRepo.getListRevision();
  }

  getById(id: number): Bookmark | null {
    const tags = this.tagRepo.getTagsForBookmark(id);
    const tagsMap = new Map([[id, tags]]);
    return this.bookmarkRepo.findById(id, tagsMap);
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
}
