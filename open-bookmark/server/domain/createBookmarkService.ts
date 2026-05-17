import type Database from "better-sqlite3";
import { getDb } from "../utils/db";
import { BookmarkRepository } from "../repositories/bookmarkRepository";
import { TagRepository } from "../repositories/tagRepository";
import { BookmarkService } from "./bookmarkService";

export function createBookmarkService(db: Database.Database = getDb()): BookmarkService {
  return new BookmarkService({
    bookmarkRepo: new BookmarkRepository(db),
    tagRepo: new TagRepository(db),
  });
}
