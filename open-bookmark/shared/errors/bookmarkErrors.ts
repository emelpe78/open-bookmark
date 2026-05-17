export const BOOKMARK_ERROR_CODES = [
  "NOT_FOUND",
  "DUPLICATE_URL",
  "INVALID_URL",
  "LOAD_FAILED",
  "EMPTY_TAG_NAME",
] as const;

export type BookmarkErrorCode = (typeof BOOKMARK_ERROR_CODES)[number];

export const BOOKMARK_ERROR_MESSAGES: Record<BookmarkErrorCode, string> = {
  NOT_FOUND: "Bookmark nicht gefunden.",
  DUPLICATE_URL: "Ein Bookmark mit dieser URL existiert bereits.",
  INVALID_URL: "Ungültige URL.",
  LOAD_FAILED: "Bookmark konnte nicht geladen werden.",
  EMPTY_TAG_NAME: "Tag-Name darf nicht leer sein.",
};

export class BookmarkDomainError extends Error {
  readonly code: BookmarkErrorCode;

  constructor(code: BookmarkErrorCode, message?: string) {
    super(message ?? BOOKMARK_ERROR_MESSAGES[code]);
    this.name = "BookmarkDomainError";
    this.code = code;
  }
}

export function getBookmarkErrorMessage(code: BookmarkErrorCode): string {
  return BOOKMARK_ERROR_MESSAGES[code];
}
